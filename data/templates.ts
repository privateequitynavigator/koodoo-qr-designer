export type TemplateId = "specialty-cafe";

export type TemplateMeta = {
  id: TemplateId;
  name: string;
  category: string;
  description: string;
  accentColor: string;
};

export const templates: TemplateMeta[] = [
  {
    id: "specialty-cafe",
    name: "Standard Template",
    category: "",
    description:
      "Fully editable table stand card — colours, fonts, logo, and text are customisable per merchant.",
    accentColor: "#C9A96E",
  },
];