export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export const faqCategories = [
  "Registration",
  "Eligibility",
  "Payment",
  "Teams",
  "Problem Statements",
  "Submission",
];

export const faqs: FAQItem[] = [
  {
    id: "faq1",
    question: "Is individual registration required?",
    answer:
      "Yes. Every participant must create an individual account and complete the registration process. You cannot register as a group — each person registers separately.",
    category: "Registration",
  },
  {
    id: "faq2",
    question: "How do I register for Innovators Arena 2.0?",
    answer:
      "Click Register Now on the homepage, create your account, complete your profile, then create or join a team of 4–6 members. The Team Leader then pays the ₹100 Round 1 fee to unlock the project submission form.",
    category: "Registration",
  },
  {
    id: "faq3",
    question: "Who is eligible to participate?",
    answer:
      "Innovators Arena 2.0 is open to all students — undergraduate, postgraduate, and diploma students from any recognized college or institution. There is no restriction on branch, stream, or year of study.",
    category: "Eligibility",
  },
  {
    id: "faq4",
    question: "Can students from any college participate?",
    answer:
      "Yes. Mixed-college teams are also allowed. Each participant must be a currently enrolled student.",
    category: "Eligibility",
  },
  {
    id: "faq5",
    question: "How much is the registration fee?",
    answer:
      "The fee is split across rounds. Round 1: the Team Leader pays ₹100, which unlocks the project submission form. Round 2: teams selected for the offline finals pay ₹200 per member. The fee covers your full participation in the 36-hour hackathon.",
    category: "Payment",
  },
  {
    id: "faq6",
    question: "When do I pay the registration fee?",
    answer:
      "Round 1 requires a ₹100 payment by the Team Leader, which unlocks the project submission form. The Round 2 payment (₹200 per member) applies only to teams selected for the offline finals.",
    category: "Payment",
  },
  {
    id: "faq7",
    question: "How many members can be in a team?",
    answer:
      "4 to 6 members. Teams with fewer than 4 or more than 6 members are not allowed. Mixed-college teams are permitted.",
    category: "Teams",
  },
  {
    id: "faq8",
    question: "How do I create a team?",
    answer:
      "After completing your profile, go to your Dashboard and click 'Create Team'. Enter your team name and select your problem statement. A unique Team ID (e.g., IA26-7F4K9) will be generated. Share this ID with your teammates.",
    category: "Teams",
  },
  {
    id: "faq9",
    question: "How do my teammates join my team?",
    answer:
      "Share your Team ID with your teammates. They should go to their Dashboard, click 'Join Team', and enter your Team ID. Each teammate must have their own registered account.",
    category: "Teams",
  },
  {
    id: "faq10",
    question: "When will problem statements be published?",
    answer:
      "Problem statements are already available for browsing on the Problem Statements page. Browse the 240 available problem statements across 16 themes.",
    category: "Problem Statements",
  },
  {
    id: "faq11",
    question: "Can our team change the problem statement?",
    answer:
      "You may change your problem statement before the team is confirmed. Refer to official guidelines once published for final rules on problem statement changes.",
    category: "Problem Statements",
  },
  {
    id: "faq12",
    question: "Who can submit the Round 1 project form?",
    answer:
      "The Team Leader. The Round 1 project submission form is only available to the Team Leader once the ₹100 Round 1 fee has been paid. Other members can see the team but cannot submit on behalf of the team.",
    category: "Submission",
  },
  {
    id: "faq13",
    question: "How does the round system work?",
    answer:
      "Round 1: the Team Leader pays ₹100 and submits the team's project through the Round 1 form. The organisers then select teams to advance. Round 2: selected teams pay ₹200 per member and take part in the 36-hour offline grand finale. There is no second submission form.",
    category: "Submission",
  },
  {
    id: "faq17",
    question: "Is there a refund for the registration fee?",
    answer:
      "Please refer to the Refund Policy for details. For specific refund queries, contact the organizing team directly.",
    category: "Payment",
  },
];
