require('dotenv').config();

const admin = require('firebase-admin');

// Initialize Firebase Admin
try {
  const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });

  const db = admin.database();
  const ref = db.ref();

  console.log('✅ Firebase Realtime Database connected successfully!');
  console.log('Database URL:', process.env.FIREBASE_DATABASE_URL);

  // Add demo data
  async function seedDatabase() {
    try {
      // 1. Add sample problem statements
      const problemStatementsRef = ref.child('problemStatements');
      const sampleProblemStatements = [
        {
          id: 'ps-001',
          title: 'Sustainable Energy',
          description: 'Build a solution to optimize energy consumption in residential buildings',
          category: 'Energy & Environment',
          difficulty: 'Medium',
          reward: 5000,
          createdAt: admin.database.ServerValue.TIMESTAMP
        },
        {
          id: 'ps-002',
          title: 'Waste Management',
          description: 'Develop an app to track and reduce household waste',
          category: 'Environment',
          difficulty: 'Easy',
          reward: 3000,
          createdAt: admin.database.ServerValue.TIMESTAMP
        },
        {
          id: 'ps-003',
          title: 'Health Monitoring',
          description: 'Create a wearable or app for basic health vitals tracking',
          category: 'HealthTech',
          difficulty: 'Hard',
          reward: 8000,
          createdAt: admin.database.ServerValue.TIMESTAMP
        }
      ];

      await problemStatementsRef.set(sampleProblemStatements);
      console.log('✅ Problem statements added');

      // 2. Add sample organizers
      const organizersRef = ref.child('organizers');
      const sampleOrganizers = [
        {
          id: 'org-001',
          name: 'Aravind Muthiah',
          designation: 'Event Lead',
          photo: 'https://via.placeholder.com/150',
          linkedin: 'https://linkedin.com/in/aravindmuthiah'
        },
        {
          id: 'org-002',
          name: 'Nethaji R',
          designation: 'Technical Coordinator',
          photo: 'https://via.placeholder.com/150',
          linkedin: 'https://linkedin.com/in/nethaji'
        }
      ];

      await organizersRef.set(sampleOrganizers);
      console.log('✅ Organizers added');

      // 3. Add sample sponsors
      const sponsorsRef = ref.child('sponsors');
      const sampleSponsors = [
        {
          id: 'sp-001',
          name: 'Electro Hub',
          logo: 'https://via.placeholder.com/200x50',
          website: 'https://electrohub.example.com'
        },
        {
          id: 'sp-002',
          name: 'DLI',
          logo: 'https://via.placeholder.com/200x50',
          website: 'https://dli.example.com'
        }
      ];

      await sponsorsRef.set(sampleSponsors);
      console.log('✅ Sponsors added');

      // 4. Add sample timeline events
      const timelineRef = ref.child('timeline');
      const sampleTimeline = [
        {
          id: 'tl-001',
          title: 'Registration Opens',
          description: 'Teams can start registering for the hackathon',
          date: '2026-12-01',
          type: 'event'
        },
        {
          id: 'tl-002',
          title: 'Hackathon Start',
          description: '36-hour hackathon begins',
          date: '2027-01-05',
          type: 'event'
        },
        {
          id: 'tl-003',
          title: 'Submission Deadline',
          description: 'Team project submissions due',
          date: '2027-01-07',
          type: 'event'
        }
      ];

      await timelineRef.set(sampleTimeline);
      console.log('✅ Timeline events added');

      // 5. Add sample FAQ
      const faqRef = ref.child('faqs');
      const sampleFaqs = [
        {
          id: 'faq-001',
          question: 'Who can participate?',
          answer: 'Students currently enrolled in college or university, or recent graduates (within 1 year)'
        },
        {
          id: 'faq-002',
          question: 'How many members in a team?',
          answer: 'Teams can have 2-6 members'
        },
        {
          id: 'faq-003',
          question: 'Is there a participation fee?',
          answer: 'Yes, ₹200 per participant'
        }
      ];

      await faqRef.set(sampleFaqs);
      console.log('✅ FAQs added');

      console.log('\n🎉 Database seeded successfully!');
      console.log('You can now view data in Firebase Console at:', process.env.FIREBASE_DATABASE_URL);
      
      process.exit(0);
    } catch (error) {
      console.error('❌ Error seeding database:', error);
      process.exit(1);
    }
  }

  seedDatabase();

} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  console.error('Make sure your .env file has valid Firebase credentials');
  process.exit(1);
}