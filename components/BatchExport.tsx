"use client";

/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { FolderOpen, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import ExportCard, {
  EXPORT_HEIGHT,
  EXPORT_WIDTH,
  type CardData,
} from "@/components/ExportCard";

const EXPORT_PIXEL_RATIO = 3;

// ─── Types ───────────────────────────────────────────────────────────────────
type QrEntry = {
  tableNumber: string;   // "01", "02", "A1" etc
  file:        File;
  rasterised:  string;   // base64 PNG data URL after canvas rasterisation
  status:      "pending" | "done" | "error";
};

// ─── Filename parser ──────────────────────────────────────────────────────────
// Matches: qr_01.png, qr_02.jpg, qr_A1.png, qr_VIP.png etc.
// Captures everything between "qr_" and the extension.
const QR_FILENAME_RE = /^qr_([a-zA-Z0-9]+)\.(png|jpg|jpeg|svg|webp)$/i;

function parseQrFiles(files: FileList): { matched: QrEntry[]; skipped: string[] } {
  const matched: Omit<QrEntry, "rasterised" | "status">[] = [];
  const skipped: string[] = [];

  Array.from(files).forEach((file) => {
    // Only look at the filename, not the full path (webkitdirectory gives full path)
    const name = file.name;
    const m = name.match(QR_FILENAME_RE);
    if (m) {
      matched.push({ tableNumber: m[1], file });
    } else {
      skipped.push(name);
    }
  });

  // Sort numerically where possible, then alpha
  matched.sort((a, b) => {
    const na = parseInt(a.tableNumber, 10);
    const nb = parseInt(b.tableNumber, 10);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.tableNumber.localeCompare(b.tableNumber);
  });

  return {
    matched: matched.map((m) => ({ ...m, rasterised: "", status: "pending" })),
    skipped,
  };
}

// ─── Rasterise one file to a 512×512 PNG data URL ────────────────────────────
function rasteriseFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const img = new Image();
      img.onerror = () => resolve(dataUrl); // fallback: use as-is
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width  = 512;
          canvas.height = 512;
          const ctx = canvas.getContext("2d");
          if (!ctx) { resolve(dataUrl); return; }
          ctx.drawImage(img, 0, 0, 512, 512);
          resolve(canvas.toDataURL("image/png"));
        } catch {
          resolve(dataUrl);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

// ─── Wait for two animation frames (lets React repaint the hidden card) ───────
function waitFrames(): Promise<void> {
  return new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BATCH EXPORT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function BatchExport({ baseCardData }: { baseCardData: CardData }) {
  const folderInputRef = useRef<HTMLInputElement>(null);
  const exportRef      = useRef<HTMLDivElement>(null);

  const [entries,     setEntries]     = useState<QrEntry[]>([]);
  const [skipped,     setSkipped]     = useState<string[]>([]);
  const [isRunning,   setIsRunning]   = useState(false);
  const [progress,    setProgress]    = useState(0);        // 0-100
  const [doneCount,   setDoneCount]   = useState(0);
  const [errorCount,  setErrorCount]  = useState(0);
  const [activeCard,  setActiveCard]  = useState<CardData | null>(null); // currently rendering

  // ── Folder selected ─────────────────────────────────────────────────────────
  async function handleFolderSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const { matched, skipped: sk } = parseQrFiles(files);
    setSkipped(sk);
    setEntries([]);
    setProgress(0);
    setDoneCount(0);
    setErrorCount(0);

    if (matched.length === 0) {
      setEntries([]);
      return;
    }

    // Rasterise all files upfront so generation loop is fast
    const rasterised = await Promise.all(
      matched.map(async (entry) => ({
        ...entry,
        rasterised: await rasteriseFile(entry.file),
      }))
    );
    setEntries(rasterised);
  }

  // ── Generate all ────────────────────────────────────────────────────────────
  async function handleGenerateAll() {
    if (isRunning || entries.length === 0) return;
    setIsRunning(true);
    setProgress(0);
    setDoneCount(0);
    setErrorCount(0);

    // Reset all statuses
    setEntries((prev) => prev.map((e) => ({ ...e, status: "pending" })));

    const zip = new JSZip();
    const merchantPart = baseCardData.merchantName.trim() || "Merchant";
    const tablePart    = baseCardData.tablePrefix.trim()  || "Table";

    await document.fonts.ready;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      // Build card data for this table — only qrImage + tableNumber change
      const cardForThis: CardData = {
        ...baseCardData,
        qrImage:     entry.rasterised,
        tableNumber: entry.tableNumber,
      };

      setActiveCard(cardForThis);
      await waitFrames(); // let React render the hidden card

      try {
        if (!exportRef.current) throw new Error("Export ref missing");

        const dataUrl = await toPng(exportRef.current, {
          cacheBust:       true,
          pixelRatio:      EXPORT_PIXEL_RATIO,
          backgroundColor: baseCardData.bgColor || "#FFFFFF",
          width:           EXPORT_WIDTH,
          height:          EXPORT_HEIGHT,
          style: {
            width:  `${EXPORT_WIDTH}px`,
            height: `${EXPORT_HEIGHT}px`,
          },
        });

        // Strip the data:image/png;base64, prefix for JSZip
        const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
        const filename = `${merchantPart}_${tablePart}_${entry.tableNumber}.png`;
        zip.file(filename, base64, { base64: true });

        setEntries((prev) =>
          prev.map((e, idx) => idx === i ? { ...e, status: "done" } : e)
        );
        setDoneCount((c) => c + 1);
      } catch (err) {
        console.error(`Failed for table ${entry.tableNumber}:`, err);
        setEntries((prev) =>
          prev.map((e, idx) => idx === i ? { ...e, status: "error" } : e)
        );
        setErrorCount((c) => c + 1);
      }

      setProgress(Math.round(((i + 1) / entries.length) * 100));
    }

    // Download ZIP
    try {
      const blob = await zip.generateAsync({ type: "blob" });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href     = url;
      link.download = `${merchantPart}_Tables_Batch.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("ZIP generation failed:", err);
      alert("ZIP creation failed. Please try again.");
    }

    setActiveCard(null);
    setIsRunning(false);
  }

  // ── Reset ───────────────────────────────────────────────────────────────────
  function handleReset() {
    setEntries([]);
    setSkipped([]);
    setProgress(0);
    setDoneCount(0);
    setErrorCount(0);
    setActiveCard(null);
    if (folderInputRef.current) folderInputRef.current.value = "";
  }

  const total    = entries.length;
  const isDone   = !isRunning && doneCount > 0;
  const hasError = errorCount > 0;

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-5 max-w-2xl">

        {/* ── Header ── */}
        <div>
          <h3 className="text-white font-semibold text-lg">Batch Export</h3>
          <p className="text-slate-500 text-sm mt-1">
            Upload your QR folder and generate all table cards at once.
          </p>
        </div>

        {/* ── Instructions ── */}
        <div className="rounded-xl bg-white/[0.03] border border-white/8 px-4 py-3 space-y-1.5">
          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest mb-2">File naming rules</p>
          <p className="text-[12px] text-slate-400">• Name each QR file as <span className="font-mono text-emerald-400">qr_01.png</span>, <span className="font-mono text-emerald-400">qr_02.png</span> … up to <span className="font-mono text-emerald-400">qr_100.png</span></p>
          <p className="text-[12px] text-slate-400">• Put all QR files in a single folder — no subfolders</p>
          <p className="text-[12px] text-slate-400">• Table numbers can be numeric <span className="font-mono text-slate-300">01</span> or alphanumeric <span className="font-mono text-slate-300">A1</span>, <span className="font-mono text-slate-300">VIP</span></p>
          <p className="text-[12px] text-slate-400">• Card design, colours, logo and font are taken from your Single tab settings</p>
        </div>

        {/* ── Folder picker ── */}
        <div>
          <label className="flex items-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-4 cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/[0.03] transition">
            <FolderOpen size={18} className="text-slate-500 flex-shrink-0" />
            <div>
              <p className="text-sm text-slate-300">
                {total > 0 ? `${total} QR file${total > 1 ? "s" : ""} detected` : "Select QR folder"}
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">Click to open folder picker</p>
            </div>
            {total > 0 && (
              <span className="ml-auto text-[11px] text-emerald-400 font-semibold">
                {total} ready
              </span>
            )}
            <input
              ref={folderInputRef}
              type="file"
              // @ts-expect-error — webkitdirectory is non-standard but universally supported
              webkitdirectory=""
              multiple
              accept="image/*"
              onChange={handleFolderSelect}
              className="hidden"
              disabled={isRunning}
            />
          </label>
        </div>

        {/* ── Manifest ── */}
        {(entries.length > 0 || skipped.length > 0) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">
                Detected files
              </p>
              {!isRunning && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[11px] text-slate-600 hover:text-red-400 underline underline-offset-2 transition"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="rounded-xl border border-white/8 overflow-hidden">
              {/* Matched entries */}
              <div className="max-h-[280px] overflow-y-auto divide-y divide-white/[0.04]">
                {entries.map((entry) => (
                  <div key={entry.tableNumber} className="flex items-center gap-3 px-3 py-2">
                    {/* Status icon */}
                    {entry.status === "done" && (
                      <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                    )}
                    {entry.status === "error" && (
                      <XCircle size={14} className="text-red-400 flex-shrink-0" />
                    )}
                    {entry.status === "pending" && (
                      <div className="w-[14px] h-[14px] rounded-full border border-white/20 flex-shrink-0" />
                    )}

                    {/* QR thumb */}
                    <img
                      src={entry.rasterised || ""}
                      alt=""
                      className="w-7 h-7 rounded object-cover opacity-80 flex-shrink-0"
                    />

                    {/* Filename */}
                    <span className="text-[12px] text-slate-400 flex-1 truncate font-mono">
                      {entry.file.name}
                    </span>

                    {/* Arrow */}
                    <span className="text-slate-600 text-[11px]">→</span>

                    {/* Output label */}
                    <span className="text-[12px] text-slate-300 font-semibold">
                      Table {entry.tableNumber}
                    </span>
                  </div>
                ))}
              </div>

              {/* Skipped files */}
              {skipped.length > 0 && (
                <div className="border-t border-white/8 px-3 py-2">
                  <p className="text-[11px] text-slate-600 mb-1">
                    {skipped.length} file{skipped.length > 1 ? "s" : ""} skipped (name doesn't match <span className="font-mono">qr_XX.png</span>)
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {skipped.slice(0, 8).map((name) => (
                      <span key={name} className="text-[10px] font-mono text-slate-600 bg-white/5 px-1.5 py-0.5 rounded">
                        {name}
                      </span>
                    ))}
                    {skipped.length > 8 && (
                      <span className="text-[10px] text-slate-700">+{skipped.length - 8} more</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Progress bar ── */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">
                Generating {doneCount + errorCount} of {total}…
              </span>
              <span className="text-slate-400 font-mono">{progress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/8 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            {errorCount > 0 && (
              <p className="text-[11px] text-red-400 flex items-center gap-1.5">
                <AlertCircle size={12} />
                {errorCount} card{errorCount > 1 ? "s" : ""} failed — will still download what succeeded
              </p>
            )}
          </div>
        )}

        {/* ── Done state ── */}
        {isDone && !isRunning && (
          <div className={`rounded-xl px-4 py-3 flex items-center gap-3 ${hasError ? "bg-red-500/8 border border-red-500/20" : "bg-emerald-500/8 border border-emerald-500/20"}`}>
            {hasError
              ? <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              : <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
            }
            <div>
              <p className="text-sm font-semibold text-white">
                {hasError
                  ? `${doneCount} exported, ${errorCount} failed`
                  : `All ${doneCount} cards exported successfully`
                }
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                ZIP downloaded to your Downloads folder
              </p>
            </div>
          </div>
        )}

        {/* ── Generate button ── */}
        {entries.length > 0 && (
          <button
            type="button"
            onClick={handleGenerateAll}
            disabled={isRunning}
            className={`w-full rounded-xl py-3 text-sm font-bold tracking-wide transition ${
              isRunning
                ? "bg-white/5 text-slate-500 cursor-not-allowed"
                : "bg-emerald-500 hover:bg-emerald-400 text-white"
            }`}
          >
            {isRunning
              ? `Generating… ${doneCount + errorCount} / ${total}`
              : `Generate ${total} Card${total > 1 ? "s" : ""} & Download ZIP`
            }
          </button>
        )}
      </div>

      {/* ── Hidden render target ── */}
      {/* This sits off-screen. Each loop iteration updates activeCard and waits
          for React to repaint before html-to-image captures it. */}
      <div
        className="fixed pointer-events-none overflow-hidden"
        style={{ left: -99999, top: 0, width: EXPORT_WIDTH, height: EXPORT_HEIGHT }}
      >
        <div ref={exportRef} style={{ width: EXPORT_WIDTH, height: EXPORT_HEIGHT }}>
          {activeCard && (
            <ExportCard templateId="specialty-cafe" data={activeCard} />
          )}
        </div>
      </div>
    </>
  );
}