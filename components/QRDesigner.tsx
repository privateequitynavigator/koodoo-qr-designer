"use client";

/* eslint-disable @next/next/no-img-element */

import {
  CakeSlice,
  Coffee,
  Circle,
  ImageIcon,
  RectangleHorizontal,
  Square,
  Utensils,
  Wine,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import ExportCard, {
  EXPORT_HEIGHT,
  EXPORT_WIDTH,
  getFontClass,
  type CardData,
  type FontFamily,
  type LogoIconId,
  type LogoShape,
  type LogoStyle,
} from "@/components/ExportCard";
import PreviewModal from "@/components/PreviewModal";
import TemplateGrid from "@/components/TemplateGrid";
import BatchExport from "@/components/BatchExport";
import { templates, type TemplateId } from "@/data/templates";

const EXPORT_PIXEL_RATIO = 3;

// ─── Colour presets ──────────────────────────────────────────────────────────
const bgPresets = [
  { label: "Cream",     value: "#F5EDE3" },
  { label: "White",     value: "#FFFFFF" },
  { label: "Warm Off-White", value: "#FAF8F5" },
  { label: "Charcoal",  value: "#1C1C1E" },
  { label: "Deep Navy", value: "#0A0F1E" },
  { label: "Sage",      value: "#E8EFE8" },
  { label: "Blush",     value: "#F9EEE8" },
];

const accentPresets = [
  "#C9A96E", "#10B981", "#EF4444", "#F59E0B",
  "#6366F1", "#EC4899", "#06B6D4", "#8B5CF6",
  "#F97316", "#14B8A6",
];

// ─── Font options ────────────────────────────────────────────────────────────
const fontOptions: { id: FontFamily; label: string; sample: string }[] = [
  { id: "playfair",  label: "Playfair",     sample: "Aa" },
  { id: "cormorant", label: "Cormorant",    sample: "Aa" },
  { id: "space",     label: "Space Grotesk",sample: "Aa" },
  { id: "jakarta",   label: "Plus Jakarta", sample: "Aa" },
  { id: "vietnam",   label: "Be Vietnam",   sample: "Aa" },
  { id: "inter",     label: "Inter",        sample: "Aa" },
  { id: "nunito",    label: "Nunito",       sample: "Aa" },
  { id: "dmsans",    label: "DM Sans",      sample: "Aa" },
];

// ─── Logo icon options ────────────────────────────────────────────────────────
const logoIcons: { id: LogoIconId; label: string; icon: React.ElementType }[] = [
  { id: "utensils",   label: "Restaurant", icon: Utensils  },
  { id: "coffee",     label: "Cafe",       icon: Coffee    },
  { id: "wine",       label: "Bar",        icon: Wine      },
  { id: "cake-slice", label: "Bakery",     icon: CakeSlice },
];

// ─── Default card data ───────────────────────────────────────────────────────
const DEFAULT_CARD: CardData = {
  merchantName:     "THE GARDEN KITCHEN",
  tagline:          "Fresh Daily",
  tablePrefix:      "TABLE",
  tableNumber:      "01",
  qrImage:          "/sample-qr.png",
  logoStyle:        "square",
  logoIcon:         "utensils",
  accentColor:      "#C9A96E",
  bgColor:          "#FFFFFF",
  textColorPrimary: "#3D2B1F",
  textColorTable:   "#3D2B1F",
  fontFamily:       "jakarta",
  logoUpload:       null,
  logoShape:        "circle",
  scanLabel:        "SCAN TO ORDER",
  showQr:           true,
};

// ─── Small reusable components ───────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500 font-semibold mb-2">
      {children}
    </p>
  );
}

function ColorSwatch({
  color,
  active,
  onClick,
  label,
}: {
  color: string;
  active: boolean;
  onClick: () => void;
  label?: string;
}) {
  const isWhite = color === "#FFFFFF" || color === "#FAF8F5" || color === "#FAF8F4";
  return (
    <button
      type="button"
      onClick={onClick}
      title={label || color}
      className="relative aspect-square rounded-lg border-2 transition hover:scale-105 focus:outline-none"
      style={{
        backgroundColor: color,
        borderColor: active ? "#ffffff" : isWhite ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.12)",
        boxShadow: active ? `0 0 0 2px #06080e, 0 0 0 4px ${color}` : "none",
        minWidth: 28,
        minHeight: 28,
      }}
    >
      {isWhite && (
        <div
          className="absolute inset-0 rounded-[6px] pointer-events-none"
          style={{ border: "1px solid rgba(0,0,0,0.12)" }}
        />
      )}
    </button>
  );
}

function ColorPickerRow({
  label,
  value,
  presets,
  onChange,
}: {
  label: string;
  value: string;
  presets: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <div className="flex items-center gap-2 flex-wrap">
        {presets.map((c) => (
          <ColorSwatch
            key={c}
            color={c}
            active={value === c}
            onClick={() => onChange(c)}
          />
        ))}
        {/* Free-pick */}
        <label
          className="relative aspect-square rounded-lg border-2 border-white/10 overflow-hidden cursor-pointer hover:border-white/30 transition"
          style={{ minWidth: 28, minHeight: 28 }}
          title="Custom colour"
        >
          <span className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400">+</span>
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>
        {/* Current value chip */}
        <span className="text-[10px] font-mono text-slate-500 ml-1">{value}</span>
      </div>
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
function Divider() {
  return <div className="border-t border-white/8 my-1" />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DESIGNER
// ═══════════════════════════════════════════════════════════════════════════════
export default function QRDesigner() {
  const exportRef    = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef   = useRef<HTMLInputElement>(null);

  const [isDownloading, setIsDownloading]   = useState(false);
  const [isPreviewOpen, setIsPreviewOpen]   = useState(false);
  const [activeTab, setActiveTab]           = useState<"single" | "batch">("single");
  const [selectedTemplateId]                = useState<TemplateId>("specialty-cafe");
  const [cardData, setCardData]             = useState<CardData>(DEFAULT_CARD);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) || templates[0],
    [selectedTemplateId]
  );

  useEffect(() => {
    document.body.style.overflow = isPreviewOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isPreviewOpen]);

  function update<K extends keyof CardData>(key: K, value: CardData[K]) {
    setCardData((prev) => ({ ...prev, [key]: value }));
  }

  // ── Logo upload ─────────────────────────────────────────────────────────────
  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      update("logoUpload", result);
    };
    reader.readAsDataURL(file);
  }

  function clearLogo() {
    update("logoUpload", null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  // ── QR image upload ─────────────────────────────────────────────────────────
  // SVGs carry their own intrinsic dimensions and ignore CSS width/height in some
  // render paths. We rasterise everything to PNG via canvas on upload so the QR
  // image is always a plain raster at a fixed size — no surprises.
  function handleQrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;

      // Rasterise to 512×512 PNG regardless of source format
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width  = 512;
        canvas.height = 512;
        const ctx = canvas.getContext("2d");
        if (!ctx) { update("qrImage", dataUrl); return; }
        ctx.drawImage(img, 0, 0, 512, 512);
        const pngUrl = canvas.toDataURL("image/png");
        update("qrImage", pngUrl);
      };
      img.onerror = () => {
        // Fallback: store as-is if rasterisation fails
        update("qrImage", dataUrl);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  function clearQr() {
    update("qrImage", "/sample-qr.png");
    if (qrInputRef.current) qrInputRef.current.value = "";
  }

  // ── Export ──────────────────────────────────────────────────────────────────
  async function downloadPNG(templateId: TemplateId = selectedTemplateId) {
    if (isDownloading) return;
    try {
      setIsDownloading(true);
      await document.fonts.ready;
      await new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });
      if (!exportRef.current) return;

      const dataUrl = await toPng(exportRef.current, {
        cacheBust: true,
        pixelRatio: EXPORT_PIXEL_RATIO,
        backgroundColor: cardData.bgColor || "#F5EDE3",
        width: EXPORT_WIDTH,
        height: EXPORT_HEIGHT,
        style: { width: `${EXPORT_WIDTH}px`, height: `${EXPORT_HEIGHT}px` },
      });

      // Filename: "THE GARDEN KITCHEN_Table_01.png"
      const merchantPart = cardData.merchantName.trim() || "Merchant";
      const tablePart    = cardData.tablePrefix.trim()  || "Table";
      const numberPart   = cardData.tableNumber.trim()  || "01";
      const filename     = `${merchantPart}_${tablePart}_${numberPart}.png`;

      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("PNG export failed:", err);
      alert("PNG export failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <main className="min-h-screen bg-[#06080e] text-white px-6 py-8">

      {/* ── Header ── */}
      <header className="flex items-center justify-between max-w-6xl mx-auto mb-6">
        <div className="flex items-center gap-4">
          <img src="/koodoo-logo.png" alt="KooDoo" className="h-9 w-auto object-contain" />
          <p className="text-xs uppercase tracking-widest text-slate-500">Table Stand Designer</p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
          {(["single", "batch"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === tab
                  ? "bg-emerald-500 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab === "single" ? "Single" : "Batch Export"}
            </button>
          ))}
        </div>
      </header>

      {/* ── Single tab ── */}
      {activeTab === "single" && (
        <section className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">

          {/* LEFT PANEL — Customize */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-6">
          <h3 className="text-white font-semibold text-lg">Customise</h3>

          {/* ── Merchant Info ── */}
          <div className="space-y-4">
            <SectionLabel>Merchant Info</SectionLabel>

            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Merchant Name</label>
              <input
                type="text"
                value={cardData.merchantName}
                onChange={(e) => update("merchantName", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-emerald-500 text-sm"
                placeholder="THE GARDEN KITCHEN"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Tagline</label>
              <input
                type="text"
                value={cardData.tagline}
                onChange={(e) => update("tagline", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-emerald-500 text-sm"
                placeholder="Fresh Daily"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Table</label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={cardData.tablePrefix}
                  onChange={(e) => update("tablePrefix", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-emerald-500 text-center text-sm"
                  placeholder="TABLE"
                />
                <input
                  type="text"
                  value={cardData.tableNumber}
                  onChange={(e) => update("tableNumber", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-emerald-500 text-center text-sm"
                  placeholder="01"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Scan Label</label>
              <input
                type="text"
                value={cardData.scanLabel ?? "Scan to Order"}
                onChange={(e) => update("scanLabel", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-emerald-500 text-sm"
                placeholder="Scan to Order"
              />
              <p className="text-[11px] text-slate-600 mt-1.5">
                Change to anything — e.g. "Order Here", "Scan & Enjoy"
              </p>
            </div>
          </div>

          <Divider />

          {/* ── Logo ── */}
          <div className="space-y-3">
            <SectionLabel>Logo</SectionLabel>

            {/* Upload area */}
            {cardData.logoUpload ? (
              <div className="flex items-center gap-3">
                <img
                  src={cardData.logoUpload}
                  alt="Uploaded logo"
                  className="h-8 w-auto object-contain max-w-[100px] rounded opacity-90"
                />
                <span className="text-xs text-slate-500 flex-1">Logo uploaded</span>
                <button
                  type="button"
                  onClick={clearLogo}
                  className="text-slate-600 hover:text-red-400 transition text-[11px] underline underline-offset-2"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2.5 cursor-pointer hover:border-white/15 hover:bg-white/[0.04] transition">
                <ImageIcon size={15} className="text-slate-600 flex-shrink-0" />
                <span className="text-sm text-slate-400">Upload logo</span>
                <span className="text-[11px] text-slate-600 ml-auto">PNG · JPG · SVG</span>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
            )}

            {/* Logo shape */}
            <div>
              <label className="block text-xs text-slate-400 mb-2">Logo Shape</label>
              <div className="grid grid-cols-4 gap-2">
                {(
                  [
                    { id: "circle" as LogoShape,  Icon: Circle,              label: "Circle"  },
                    { id: "square" as LogoShape,  Icon: Square,              label: "Square"  },
                    { id: "wide"   as LogoShape,  Icon: RectangleHorizontal, label: "Wide"    },
                    { id: "none"   as LogoShape,  Icon: null,                label: "None"    },
                  ] as const
                ).map(({ id, Icon, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => update("logoShape", id)}
                    className={`rounded-xl border px-2 py-2.5 flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition ${
                      cardData.logoShape === id
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                        : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20"
                    }`}
                  >
                    {Icon ? <Icon size={14} /> : <span className="text-[14px] leading-none">—</span>}
                    {label}
                  </button>
                ))}
              </div>
              {cardData.logoShape === "wide" && (
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Wide mode fits horizontal logos like AkarX — full-width, height-constrained.
                </p>
              )}
            </div>

            {/* Fallback icon picker — shown when no upload */}
            {!cardData.logoUpload && cardData.logoShape !== "none" && (
              <div>
                <label className="block text-xs text-slate-400 mb-2">Fallback Icon</label>
                <div className="grid grid-cols-4 gap-2">
                  {logoIcons.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => update("logoIcon", item.id)}
                        className={`rounded-xl border p-3 flex items-center justify-center transition ${
                          cardData.logoIcon === item.id
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                            : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20"
                        }`}
                        title={item.label}
                      >
                        <Icon size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <Divider />

          {/* ── QR Code ── */}
          <div className="space-y-3">
            <SectionLabel>QR Code</SectionLabel>

            {/* Show / Hide toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Show QR on card</span>
              <button
                type="button"
                onClick={() => update("showQr", !cardData.showQr)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  cardData.showQr ? "bg-emerald-500" : "bg-white/10"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    cardData.showQr ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Upload — only shown when QR is on */}
            {cardData.showQr && (
              <>
                {cardData.qrImage && cardData.qrImage !== "/sample-qr.png" ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={cardData.qrImage}
                      alt="QR preview"
                      className="h-8 w-8 object-contain rounded opacity-90"
                    />
                    <span className="text-xs text-slate-500 flex-1">QR code uploaded</span>
                    <button
                      type="button"
                      onClick={clearQr}
                      className="text-slate-600 hover:text-red-400 transition text-[11px] underline underline-offset-2"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2.5 cursor-pointer hover:border-white/15 hover:bg-white/[0.04] transition">
                    <ImageIcon size={15} className="text-slate-600 flex-shrink-0" />
                    <span className="text-sm text-slate-400">Upload QR code</span>
                    <span className="text-[11px] text-slate-600 ml-auto">PNG · SVG</span>
                    <input
                      ref={qrInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleQrUpload}
                      className="hidden"
                    />
                  </label>
                )}
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Export from QR Tiger, Canva, or any QR generator.
                </p>
              </>
            )}
          </div>

          <Divider />

          {/* ── Colours ── */}
          <div className="space-y-4">
            <SectionLabel>Colours</SectionLabel>

            {/* Background */}
            <div>
              <label className="block text-xs text-slate-400 mb-2">Card Background</label>
              <div className="grid grid-cols-7 gap-1.5 mb-1">
                {bgPresets.map((p) => (
                  <ColorSwatch
                    key={p.value}
                    color={p.value}
                    label={p.label}
                    active={cardData.bgColor === p.value}
                    onClick={() => update("bgColor", p.value)}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <label
                  className="relative h-7 w-7 rounded-lg border border-white/10 overflow-hidden cursor-pointer hover:border-white/30 transition flex-shrink-0"
                  title="Custom background colour"
                >
                  <span className="absolute inset-0 flex items-center justify-center text-[11px] text-slate-400">+</span>
                  <input
                    type="color"
                    value={cardData.bgColor}
                    onChange={(e) => update("bgColor", e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </label>
                <span className="text-[10px] font-mono text-slate-500">{cardData.bgColor}</span>
              </div>
            </div>

            {/* Accent colour */}
            <div>
              <label className="block text-xs text-slate-400 mb-2">Accent Colour</label>
              <div className="grid grid-cols-[repeat(10,1fr)] gap-1.5 mb-1">
                {accentPresets.map((c) => (
                  <ColorSwatch
                    key={c}
                    color={c}
                    active={cardData.accentColor === c}
                    onClick={() => update("accentColor", c)}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <label
                  className="relative h-7 w-7 rounded-lg border border-white/10 overflow-hidden cursor-pointer hover:border-white/30 transition flex-shrink-0"
                  title="Custom accent colour"
                >
                  <span className="absolute inset-0 flex items-center justify-center text-[11px] text-slate-400">+</span>
                  <input
                    type="color"
                    value={cardData.accentColor}
                    onChange={(e) => update("accentColor", e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </label>
                <span className="text-[10px] font-mono text-slate-500">{cardData.accentColor}</span>
              </div>
            </div>

            {/* Primary text colour */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Text Colour — Name, Tagline, Scan to Order, Footer
              </label>
              <div className="flex items-center gap-2">
                {["#3D2B1F","#1C1917","#111827","#FFFFFF","#F5F5F5","#6B7280"].map((c) => (
                  <ColorSwatch
                    key={c}
                    color={c}
                    active={cardData.textColorPrimary === c}
                    onClick={() => update("textColorPrimary", c)}
                  />
                ))}
                <label
                  className="relative h-7 w-7 rounded-lg border border-white/10 overflow-hidden cursor-pointer hover:border-white/30 transition flex-shrink-0"
                  title="Custom text colour"
                >
                  <span className="absolute inset-0 flex items-center justify-center text-[11px] text-slate-400">+</span>
                  <input
                    type="color"
                    value={cardData.textColorPrimary}
                    onChange={(e) => update("textColorPrimary", e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </label>
                <span className="text-[10px] font-mono text-slate-500">{cardData.textColorPrimary}</span>
              </div>
            </div>

            {/* Table text colour */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Text Colour — TABLE word &amp; Number
              </label>
              <div className="flex items-center gap-2">
                {["#3D2B1F","#1C1917","#111827","#FFFFFF","#F5F5F5","#6B7280"].map((c) => (
                  <ColorSwatch
                    key={c}
                    color={c}
                    active={cardData.textColorTable === c}
                    onClick={() => update("textColorTable", c)}
                  />
                ))}
                <label
                  className="relative h-7 w-7 rounded-lg border border-white/10 overflow-hidden cursor-pointer hover:border-white/30 transition flex-shrink-0"
                  title="Custom table colour"
                >
                  <span className="absolute inset-0 flex items-center justify-center text-[11px] text-slate-400">+</span>
                  <input
                    type="color"
                    value={cardData.textColorTable}
                    onChange={(e) => update("textColorTable", e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </label>
                <span className="text-[10px] font-mono text-slate-500">{cardData.textColorTable}</span>
              </div>
            </div>
          </div>

          <Divider />

          {/* ── Font Family ── */}
          <div>
            <SectionLabel>Font</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              {fontOptions.map((f) => {
                const cls = getFontClass(f.id);
                const active = cardData.fontFamily === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => update("fontFamily", f.id)}
                    className={`rounded-xl border px-3 py-2.5 flex items-center gap-2.5 text-left transition ${
                      active
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                        : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20"
                    }`}
                  >
                    <span className={`${cls} text-[18px] leading-none font-semibold w-7 text-center`}>
                      {f.sample}
                    </span>
                    <span className="text-[11px] font-medium leading-tight">{f.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Divider />

          {/* ── Tip ── */}
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Changes reflect live in the preview. Click the download button on the card to export at 3× HD resolution.
          </p>
        </div>

        {/* ────────────────────────────────────────────────────────────────────
            RIGHT PANEL — Template grid (single template)
        ──────────────────────────────────────────────────────────────────── */}
          <TemplateGrid
            templates={templates}
            data={cardData}
            selectedTemplateId={selectedTemplateId}
            onSelectTemplate={() => {}}
            onPreview={() => setIsPreviewOpen(true)}
            onDownload={downloadPNG}
            isDownloading={isDownloading}
          />
        </section>
      )}

      {/* ── Batch tab ── */}
      {activeTab === "batch" && (
        <section className="max-w-6xl mx-auto">
          <BatchExport baseCardData={cardData} />
        </section>
      )}

      {/* ── Preview modal ── */}
      <PreviewModal
        isOpen={isPreviewOpen}
        template={selectedTemplate}
        data={cardData}
        onClose={() => setIsPreviewOpen(false)}
        onDownload={() => downloadPNG(selectedTemplateId)}
        isDownloading={isDownloading}
      />

      {/* ── Hidden export target (single) ── */}
      <div
        className="fixed left-[-99999px] top-0 overflow-hidden pointer-events-none"
        style={{ width: EXPORT_WIDTH, height: EXPORT_HEIGHT }}
      >
        <div ref={exportRef} style={{ width: EXPORT_WIDTH, height: EXPORT_HEIGHT }}>
          <ExportCard templateId={selectedTemplateId} data={cardData} />
        </div>
      </div>
    </main>
  );
}