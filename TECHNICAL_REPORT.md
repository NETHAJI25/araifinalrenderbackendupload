# Innovators Arena 2.0 — Technical Report

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INNOVATORS ARENA 2.0 ARCHITECTURE                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐      HTTPS/REST       ┌──────────────┐                   │
│  │   VERCEL     │ ◀──────────────────▶  │   RENDER     │                   │
│  │  (Frontend)  │   API Calls (CORS)    │  (Backend)   │                   │
│  │              │                       │              │                   │
│  │ React 18     │                       │ Express.js   │                   │
│  │ Vite         │                       │ Node 18+     │                   │
│  │ TypeScript   │                       │ Firebase     │                   │
│  │ Tailwind     │                       │ Admin SDK    │                   │
│  └──────────────┘                       └──────┬───────┘                   │
│                                                 │                           │
│                                                 ▼                           │
│                                        ┌──────────────────┐                 │
│                                        │  FIREBASE RTDB   │                 │
│                                        │  (Real-time DB)  │                 │
│                                        │                  │                 │
│                                        │ /auth            │                 │
│                                        │ /users           │                 │
│                                        │ /teams           │                 │
│                                        │ /problemStatements                │
│                                        │ /organizers      │                 │
│                                        │ /sponsors        │                 │
│                                        │ /timeline        │                 │
│                                        │ /faqs            │                 │
│                                        │ /payments        │                 │
│                                        │ /submissions     │                 │
│                                        └──────────────────┘                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Frontend Technical Details

### Project Structure
```
src/
├── components/
│   ├── animations/       # SplitText, CountUp
│   ├── layout/           # Header, Footer, Sidebars
│   └── ui/               # Button, Input, Modal, Badge, etc.
├── contexts/
│   ├── AuthContext.tsx   # Auth state, login/register/logout
│   └── ToastContext.tsx  # Notification system
├── pages/
│   ├── HomePage.tsx      # Landing page with all sections
│   ├── LoginPage.tsx     # Authentication
│   ├── RegisterPage.tsx  # User registration
│   ├── ProblemStatementsPage.tsx
│   ├── TimelinePage.tsx
│   └── dashboard/        # Protected routes
│       ├── DashboardHome.tsx
│       ├── TeamPage.tsx         # Team mgmt + round-based payments
│       ├── SubmissionPage.tsx   # Final submission (Round 2 only)
│       ├── ProfilePage.tsx
│       └── ...
│   └── admin/            # Admin panel pages
├── services/
│   ├── authService.ts    # API calls for auth
│   ├── teamService.ts    # Team CRUD operations
│   └── paymentService.ts # Payment mocking
├── config/
│   └── eventConfig.ts    # Central configuration
├── data/
│   ├── problemStatements.ts
│   ├── organizers.ts
│   ├── sponsors.ts
│   ├── faq.ts
│   └── documents.ts      # Google Drive links
├── types/
│   └── index.ts          # TypeScript interfaces
└── utils/
    └── formatters.ts     # Payment status labels
```

### Key Components

#### AuthContext.tsx
```typescript
// Provides: user, isAuthenticated, login, register, logout, refreshUser
// JWT stored in localStorage, auto-refresh on app load
```

#### TeamPage.tsx — Round-Based Payment Logic
```typescript
// Round 1: team.round === 1 || undefined
//   - Only Team Leader can pay ₹100
//   - On payment: team.round = 2 (auto-advance)

// Round 2: team.round === 2
//   - All members pay ₹200 each
//   - Confirmation only after allPaidRound2 = true
```

#### SubmissionPage.tsx — Eligibility Gates
```typescript
isEligible = team exists
  && isRound2
  && memberCount 2-6
  && allPaidRound2 (₹200 each)
  && team.confirmationStatus === "confirmed"
```

---

## Backend Technical Details

### Server Structure (server.js)
```javascript
// Express app with:
// - CORS: Vercel frontend origins
// - Helmet: Security headers
// - Morgan: Request logging
// - Firebase Admin init with private key normalization
// - Keep-alive ping: setInterval(5 min) → /health
// - Routes: /api/auth, /api/teams, /api/payments, /api/admin
```

### Firebase Admin Initialization
```javascript
// Private key handling for Render env vars:
privateKey = process.env.FIREBASE_PRIVATE_KEY
  .replace(/\\n/g, '\n')  // Convert literal \n to newlines
  .replace(/^"|"$/g, ''); // Strip wrapping quotes
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check (keep-alive target) |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Current user profile |
| GET | `/api/teams/my-team` | Get user's team |
| POST | `/api/teams/create` | Create new team |
| POST | `/api/teams/join` | Join team by ID |
| POST | `/api/teams/complete` | Mark team complete |
| POST | `/api/teams/confirm` | Leader confirms team |
| POST | `/api/payments/mock` | Mock payment completion |
| GET | `/api/admin/*` | Admin-only endpoints |

---

## Database Schema (Firebase RTDB)

```
/auth
  /users/{uid}
    - email, password (hashed), role, createdAt

/users/{uid}
  - name, email, phone, college, course, year
  - city, state, country
  - profileCompleted, paymentStatus, teamId
  - role, createdAt, linkedin, github

/teams/{teamId}
  - teamId, teamName, leaderId
  - problemStatementId, problemStatementTitle
  - members[{userId, name, college, role, paymentStatus, profileCompleted, joinedAt}]
  - status: active|incomplete|complete|rejected
  - confirmationStatus: pending|ready|confirmed
  - round: 1|2          // NEW: Round tracking
  - createdAt, updatedAt

/problemStatements/{id}
  - title, description, category, difficulty, reward

/organizers/{id}
/sponsors/{id}
/timeline/{id}
/faqs/{id}
/payments/{paymentId}
/submissions/{submissionId}
```

---

## Environment Variables

### Frontend (Vercel)
```
VITE_API_URL=https://araifinalrenderbackendupload.onrender.com
```

### Backend (Render)
```
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://innovators-arena-tau.vercel.app

# Firebase
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=innovators-arena-2-0
FIREBASE_PRIVATE_KEY_ID=aa54972605d3880628ead156f6ad77f7ef6531d0
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@innovatorsarena-2-0.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=111916209909851773161
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40innovatorsarena-2-0.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://innovatorsarena-2-0-default-rtdb.firebaseio.com

# JWT
JWT_SECRET=ia2026-xK9mP2vL-super-secret-jwt-key
JWT_EXPIRES_IN=24h
```

---

## Deployment Pipeline

### Vercel (Frontend)
```yaml
# vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
- Auto-deploy on GitHub push to main
- Environment variables in Vercel dashboard
- Custom domain: innovators-arena-tau.vercel.app

### Render (Backend)
```yaml
# render.yaml
services:
  - type: web
    name: araifinalrenderbackendupload
    env: node
    buildCommand: npm install
    startCommand: node server.js
    envVars: [FIREBASE_*, JWT_*, FRONTEND_URL]
    region: ohio
    plan: free
```
- Auto-deploy on GitHub push to main
- Free tier: spins down after 15 min inactivity
- Keep-alive ping prevents spin-down

---

## Security Considerations

| Area | Implementation |
|------|----------------|
| **Auth** | JWT with 24h expiry, bcrypt password hashing |
| **CORS** | Restricted to Vercel frontend origins |
| **Headers** | Helmet.js (CSP, HSTS, X-Frame-Options) |
| **Firebase** | Admin SDK server-side only, rules via RTDB security rules |
| **Env Vars** | All secrets in platform env vars, not in code |
| **Git** | `.env` in `.gitignore`, `node_modules` removed from history |

---

## Performance

| Metric | Value |
|--------|-------|
| **Build Time** | ~2s (Vite) |
| **Bundle Size** | 677 KB JS (gzipped: 193 KB) |
| **CSS Size** | 57 KB (gzipped: 9.7 KB) |
| **TTFB (Vercel)** | <100ms |
| **API Latency** | ~200-500ms (Render free tier cold start ~30s) |

---

## Known Issues / Technical Debt

1. **Large bundle** — Consider code-splitting admin/dashboard routes
2. **Mock payments** — No real gateway integrated
3. **No automated tests** — Jest configured but no tests written
4. **Render cold starts** — Free tier spins down; keep-alive mitigates
5. **7-day log retention** — Need external logging for production
6. **No CI/CD pipeline** — Manual `vercel --prod` and git push for Render

---

## Scaling Considerations

| Current | Scale Target | Changes Needed |
|---------|--------------|----------------|
| 1 Render instance | Multiple | Upgrade to Starter/Pro plan |
| RTDB free tier | High traffic | Monitor concurrent connections |
| No CDN for assets | Global | Vercel handles static assets |
| No caching | API optimization | Add Redis/cache layer |

---

## Development Commands

```bash
# Frontend
cd frontend/
npm run dev          # Vite dev server
npm run build        # TypeScript + Vite build
npm run preview      # Preview production build

# Backend
cd backend/
npm run dev          # Nodemon
npm run start        # Production
node seed-database.js # Seed Firebase RTDB
```

---

*Technical Report v1.0 — September 2026*