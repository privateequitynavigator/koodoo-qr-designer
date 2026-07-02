"use client";

import { Eye } from "lucide-react";
import type { CardData } from "@/components/ExportCard";
import ExportCard, {
  EXPORT_HEIGHT,
  EXPORT_WIDTH,
} from "@/components/ExportCard";
import DownloadButton from "@/components/DownloadButton";
import type { TemplateMeta } from "@/data/templates";

// Larger scale so the card fills the right panel properly
const PREVIEW_SCALE = 0.95;

type TemplateCardProps = {
  template: TemplateMeta;
  data: CardData;
  isSelected: boolean;
  onSelect: () => void;
  onPreview: () => void;
  onDownload: () => void;
  isDownloading: boolean;
};

export default function TemplateCard({
  template,
  data,
  isSelected,
  onSelect,
  onPreview,
  onDownload,
  isDownloading,
}: TemplateCardProps) {
  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onSelect();
      }}
      className={`rounded-2xl border p-4 w-fit cursor-pointer transition-all ${
        isSelected
          ? "border-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.35)] bg-emerald-50/40"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      {/* Preview container — bg matches the card's own bgColor live */}
      <div
        className="rounded-xl overflow-hidden border border-slate-100"
        style={{
          width: EXPORT_WIDTH * PREVIEW_SCALE,
          height: EXPORT_HEIGHT * PREVIEW_SCALE,
          background: data.bgColor || "#F5EDE3",
        }}
      >
        <div
          style={{
            width: EXPORT_WIDTH,
            height: EXPORT_HEIGHT,
            transform: `scale(${PREVIEW_SCALE})`,
            transformOrigin: "top left",
          }}
        >
          <ExportCard templateId={template.id} data={data} />
        </div>
      </div>

      {/* Card footer row */}
      <div className="mt-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: template.accentColor }}
            />
            <h2 className="font-semibold text-sm text-slate-900">{template.name}</h2>
          </div>
          {template.category && (
            <p className="text-xs text-slate-500 mt-0.5">{template.category}</p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={(event) => {
              event.stopPropagation();
              onPreview();
            }}
            className="h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition"
            title="Preview"
            type="button"
          >
            <Eye size={18} />
          </button>

          <div onClick={(event) => event.stopPropagation()}>
            <DownloadButton onClick={onDownload} isDownloading={isDownloading} />
          </div>
        </div>
      </div>
    </div>
  );
}