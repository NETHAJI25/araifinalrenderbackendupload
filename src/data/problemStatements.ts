import problemStatementsData from "./problemStatements.json";

export interface ProblemStatement {
  id: string;
  localPsNumber: string;
  sourcePsId: string;
  serialNo: number;
  title: string;
  category: "Software" | "Hardware";
  theme: string;
}

export const themes: string[] = [
  "Smart Education",
  "Healthcare",
  "Agriculture",
  "Cybersecurity",
  "FinTech",
  "IoT",
  "Sustainability",
  "Smart Mobility",
  "Robotics",
  "Tourism",
  "Social Innovation",
  "DeepTech",
  "Disaster Management",
  "Smart Governance",
  "Rural Development",
  "Environment",
];

export const problemStatements: ProblemStatement[] = problemStatementsData as ProblemStatement[];

export const categories = ["Software", "Hardware"] as const;
