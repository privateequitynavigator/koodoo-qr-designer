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
    name: "Specialty Café",
    category: "Coffee & Cafés",
    description:
      "Warm cream colours with elegant café styling and soft textures.",
    accentColor: "#C9A96E",
  },
];