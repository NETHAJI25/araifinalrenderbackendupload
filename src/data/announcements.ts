export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  type: "info" | "warning" | "success" | "update";
  isNew: boolean;
}

export const announcements: Announcement[] = [
  {
    id: "ann1",
    title: "Registration is Now Open",
    content:
      "Registrations for Innovators Arena 2.0 are officially open! Create your account, complete your profile, and pay the ₹200 registration fee to secure your spot.",
    date: "[DATE PLACEHOLDER]",
    type: "success",
    isNew: true,
  },
  {
    id: "ann2",
    title: "Problem Statements Published",
    content:
      "Placeholder problem statements are now available for browsing. Official problem statements will be published according to the timeline. Start exploring the themes and categories.",
    date: "[DATE PLACEHOLDER]",
    type: "info",
    isNew: true,
  },
  {
    id: "ann3",
    title: "Guidelines Document Available",
    content:
      "The hackathon guidelines document and PPT format template are now available in the Guidelines section. All participants must read the guidelines before the event.",
    date: "[DATE PLACEHOLDER]",
    type: "update",
    isNew: false,
  },
  {
    id: "ann4",
    title: "Team Formation Reminder",
    content:
      "Remember to create or join a team after completing your payment. Each team must have 2–6 confirmed members. The Team Leader is responsible for the final project submission.",
    date: "[DATE PLACEHOLDER]",
    type: "info",
    isNew: false,
  },
  {
    id: "ann5",
    title: "Venue and Schedule Update",
    content:
      "Venue and detailed schedule information will be announced soon. Stay tuned to the announcements section and check the Timeline page for updates. [TO BE ANNOUNCED]",
    date: "[DATE PLACEHOLDER]",
    type: "update",
    isNew: false,
  },
];
