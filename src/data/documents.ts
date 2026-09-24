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
    type: "Google Slides / PPTX",
    path: "https://docs.google.com/presentation/d/1bTUtL_KCMQgRB9ilwnmL-PntFyXofzd4/edit?usp=sharing&ouid=110748840767488667268&rtpof=true&sd=true",
    category: "Submission",
  },
  {
    id: "guidelines",
    title: "Hackathon Guidelines",
    description:
      "Complete guidelines covering rules, regulations, evaluation criteria, and participant responsibilities.",
    type: "PDF",
    path: "https://drive.google.com/file/d/1yovAvdekpyUmSp3nDYbx73_1XgvzzfyK/view?usp=sharing",
    category: "Rules",
  },
];
