"use client";

import { X } from "lucide-react";
import type { CardData } from "@/components/ExportCard";
import ExportCard, {
  EXPORT_HEIGHT,
  EXPORT_WIDTH,
} from "@/components/ExportCard";
import DownloadButton from "@/components/DownloadButton";
import type { TemplateMeta } from "@/data/templates";

const MODAL_SCALE = 0.92;

type PreviewModalProps = {
  isOpen: boolean;
  template: TemplateMeta;
  data: CardData;
  onClose: () => void;
  onDownload: () => void;
  isDownloading: boolean;
};

export default function PreviewModal({
  isOpen,
  template,
  data,
  onClose,
  onDownload,
  isDownloading,
}: PreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-fit max-h-[95vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-white">{template.name}</h3>
            <p className="text-xs text-slate-400">{template.description}</p>
          </div>

          <div className="flex items-center gap-2">
            <DownloadButton
              onClick={onDownload}
              isDownloading={isDownloading}
            />

            <button
              onClick={onClose}
              className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
              title="Close"
              type="button"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div
          className="rounded-xl overflow-hidden bg-[#F5EDE3]"
          style={{
            width: EXPORT_WIDTH * MODAL_SCALE,
            height: EXPORT_HEIGHT * MODAL_SCALE,
          }}
        >
          <div
            style={{
              width: EXPORT_WIDTH,
              height: EXPORT_HEIGHT,
              transform: `scale(${MODAL_SCALE})`,
              transformOrigin: "top left",
            }}
          >
            <ExportCard templateId={template.id} data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}