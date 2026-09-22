// Event Configuration
// This file contains configuration specific to the Innovators Arena 2.0 event

const eventConfig = {
  // Admin emails - users with these emails will have admin privileges
  adminEmails: [
    'admin@innovatorsarena.com',
    'organizer@innovatorsarena.com',
    // Add more admin emails as needed
  ],

  // Event details
  eventName: 'Innovators Arena 2.0',
  eventYear: 2026,
  registrationFee: 200, // in INR
  currency: 'INR',

  // Team constraints
  minTeamSize: 2,
  maxTeamSize: 6,

  // Problem statements (would normally come from a CMS or database)
  problemStatements: [
    {
      id: 'ps1',
      title: 'Sustainable Energy Solutions',
      description: 'Develop innovative solutions for renewable energy and sustainability challenges.'
    },
    {
      id: 'ps2',
      title: 'Healthcare Accessibility',
      description: 'Create technologies to improve healthcare access in underserved communities.'
    },
    {
      id: 'ps3',
      title: 'Education Technology',
      description: 'Build educational tools that enhance learning outcomes and accessibility.'
    },
    {
      id: 'ps4',
      title: 'Smart Agriculture',
      description: 'Develop IoT and AI solutions for modern farming challenges.'
    },
    {
      id: 'ps5',
      title: 'Financial Inclusion',
      description: 'Create fintech solutions to bring banking services to the unbanked population.'
    }
  ],

  // Important dates
  importantDates: {
    registrationStart: '2026-01-15',
    registrationEnd: '2026-03-15',
    teamFormationDeadline: '2026-03-22',
    paymentDeadline: '2026-03-25',
    projectSubmissionDeadline: '2026-04-15',
    eventDate: '2026-05-01'
  }
};

module.exports = eventConfig;