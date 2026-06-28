"use client";

import { Download } from "lucide-react";

type DownloadButtonProps = {
  onClick: () => void;
  isDownloading: boolean;
};

export default function DownloadButton({
  onClick,
  isDownloading,
}: DownloadButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isDownloading}
      className="h-10 w-10 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 flex items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed"
      title="Download HD PNG"
      type="button"
    >
      <Download size={18} />
    </button>
  );
}