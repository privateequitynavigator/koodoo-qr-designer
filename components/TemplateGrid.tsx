"use client";

import type { CardData } from "@/components/ExportCard";
import TemplateCard from "@/components/TemplateCard";
import type { TemplateId, TemplateMeta } from "@/data/templates";

type TemplateGridProps = {
  templates: TemplateMeta[];
  data: CardData;
  selectedTemplateId: TemplateId;
  onSelectTemplate: (templateId: TemplateId) => void;
  onPreview: (templateId: TemplateId) => void;
  onDownload: (templateId: TemplateId) => void;
  isDownloading: boolean;
};

export default function TemplateGrid({
  templates,
  data,
  selectedTemplateId,
  onSelectTemplate,
  onPreview,
  onDownload,
  isDownloading,
}: TemplateGridProps) {
  return (
    // Single template — centred, larger preview scale
    <div className="flex justify-center items-start">
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          data={data}
          isSelected={selectedTemplateId === template.id}
          onSelect={() => onSelectTemplate(template.id)}
          onPreview={() => onPreview(template.id)}
          onDownload={() => onDownload(template.id)}
          isDownloading={isDownloading}
        />
      ))}
    </div>
  );
}