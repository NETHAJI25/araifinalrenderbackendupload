# Innovators Arena 2.0 - Frontend

This is the frontend application for the Innovators Arena 2.0 hackathon platform, built with React, TypeScript, Vite, and Tailwind CSS.

## Participant Dashboard Workflow

The participant dashboard follows a strict, step-by-step workflow designed to ensure complete teams and fair participation. The core process is as follows:

1. **Registration & Profile Creation**
   - Participants create an account and fill in their personal and academic details.
   - Access to team functionalities is gated behind a completed profile.

2. **Team Formation**
   - Participants can either create a new team or join an existing team using a unique `IA26-` Team ID.
   - Teams must have a minimum of 2 members and a maximum of 6 members.

3. **Team Completion**
   - Once the team has the required number of members, the **Team Leader** (the creator of the team) clicks the "Complete Team" button.
   - This action locks the team roster, preventing further members from joining.

4. **Payment**
   - **Important:** Payment is unlocked *only* after the team has been marked as "Complete" by the Team Leader.
   - Each team member must individually pay the registration fee (₹200) through their own dashboard.
   - The payment gateway simulates a real transaction and updates the user's status to "paid".

5. **Team Confirmation**
   - After *all* members of the completed team have successfully paid their individual fees, the Team Leader confirms the team.
   - This finalizes the team's registration for the event.

6. **Project Submission**
   - The submission portal is unlocked only after the team is confirmed (meaning all members have paid).
   - Only the Team Leader can upload and submit the final project documents (presentation, code links, demo videos).

## Local Development

```bash
npm install
npm run dev
```

To build for production:
```bash
npm run build
```
