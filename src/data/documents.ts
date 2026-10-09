export interface DocumentItem {
  id: string;
  title: string;
  description: string;
  type: string;
  path: string;
  category: string;
}

export const documents: DocumentItem[] = [
  {
    id: "ppt-format",
    title: "PPT Format Template",
    description:
      "Official presentation template for final project submission. All teams must use this format.",
    type: "PPTX / PDF",
    path: "/assets/documents/ppt-format.pdf",
    category: "Submission",
  },
  {
    id: "guidelines",
    title: "Hackathon Guidelines",
    description:
      "Complete guidelines covering rules, regulations, evaluation criteria, and participant responsibilities.",
    type: "PDF",
    path: "/assets/documents/guidelines.pdf",
    category: "Rules",
  },
];
