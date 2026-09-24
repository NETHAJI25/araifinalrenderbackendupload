export type TimelineStatus = "completed" | "active" | "upcoming";

export interface TimelineItem {
  id: string;
  stage: string;
  date: string;
  time: string;
  description: string;
  status: TimelineStatus;
}

export const timeline: TimelineItem[] = [
  {
    id: "t1",
    stage: "Registration Opens",
    date: "To be announced",
    time: "",
    description:
      "Participant registrations open on the official platform. Create your account and complete your profile.",
    status: "active",
  },
  {
    id: "t2",
    stage: "Registration Closes",
    date: "To be announced",
    time: "",
    description:
      "Last date for individual participant registration. Ensure your registration fee is paid and profile is complete.",
    status: "upcoming",
  },
  {
    id: "t3",
    stage: "Team Formation",
    date: "To be announced",
    time: "",
    description:
      "Form your team of 2–6 members. Create a team or join an existing one using your Team ID.",
    status: "upcoming",
  },
  {
    id: "t4",
    stage: "Problem Statement Selection",
    date: "To be announced",
    time: "",
    description:
      "Browse published problem statements and select the challenge your team will work on.",
    status: "upcoming",
  },
  {
    id: "t6",
    stage: "Hackathon Begins",
    date: "First Week of January 2027",
    time: "",
    description:
      "The 36-hour challenge officially begins. All participants must be present at the venue in Kanchipuram.",
    status: "upcoming",
  },
  {
    id: "t7",
    stage: "36-Hour Development",
    date: "First Week of January 2027",
    time: "",
    description:
      "Teams work on their solutions. Mentors are available for guidance throughout the hackathon.",
    status: "upcoming",
  },
  {
    id: "t8",
    stage: "Final Submission Opens",
    date: "First Week of January 2027",
    time: "",
    description:
      "Submission portal opens. Team leaders can upload their final PPT and project details.",
    status: "upcoming",
  },
  {
    id: "t9",
    stage: "Project Submission Deadline",
    date: "First Week of January 2027",
    time: "",
    description:
      "All project submissions must be completed before this deadline. No late submissions accepted.",
    status: "upcoming",
  },
  {
    id: "t10",
    stage: "Evaluation",
    date: "To be announced",
    time: "",
    description:
      "Expert panel reviews all submissions. Teams may be called for presentations or demos.",
    status: "upcoming",
  },
  {
    id: "t11",
    stage: "Results Announcement",
    date: "To be announced",
    time: "",
    description: "Winners and special recognition awardees are announced.",
    status: "upcoming",
  },
  {
    id: "t12",
    stage: "Certificate Distribution",
    date: "To be announced",
    time: "",
    description:
      "Participation and achievement certificates distributed to all eligible participants.",
    status: "upcoming",
  },
];
