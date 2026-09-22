# Innovators Arena 2.0 Backend

This is the backend service for the Innovators Arena 2.0 hackathon platform, built with Node.js, Express, and Firebase Realtime Database.

## Features

- User authentication (register, login, logout, profile management)
- Team management (create, join, confirm, complete teams)
- Announcement system (CRUD operations for announcements)
- Payment processing (integration with Razorpay ready)
- Project submission system
- Role-based access control (admin/participant)
- Firebase Realtime Database for data persistence
- RESTful API design
- JWT-based authentication
- Input validation and sanitization
- Error handling and logging

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Firebase Realtime Database
- **Authentication**: JSON Web Tokens (JWT)
- **Password Hashing**: Bcrypt.js
- **Validation**: Validator.js
- **Security**: Helmet.js, CORS
- **Logging**: Morgan
- **Environment**: Dotenv

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/update` - Update user profile
- `POST /api/auth/send-otp` - Send OTP (phone)
- `POST /api/auth/reset-password` - Reset password

### Teams
- `GET /api/teams/my` - Get current user's team
- `GET /api/teams/:teamId` - Get team by ID
- `POST /api/teams` - Create new team
- `POST /api/teams/join/:teamId` - Join existing team
- `POST /api/teams/:teamId/confirm` - Confirm team (leader only)
- `PUT /api/teams/:teamId/problem-statement` - Update problem statement (leader only)
- `DELETE /api/teams/:teamId/leave` - Leave team
- `POST /api/teams/:teamId/complete` - Mark team as complete (leader only)
- `GET /api/teams` - Get all teams (admin only)
- `POST /api/teams/:teamId/reject` - Reject team (admin only)

### Announcements
- `GET /api/announcements` - Get all announcements
- `GET /api/announcements/published` - Get published announcements
- `POST /api/announcements` - Create announcement
- `PUT /api/announcements/:id` - Update announcement
- `DELETE /api/announcements/:id` - Delete announcement

### Payments
- `POST /api/payments` - Create new payment
- `GET /api/payments/my` - Get current user's payment
- `GET /api/payments/:id` - Get payment by ID
- `POST /api/payments/mock-complete` - Mock complete payment (for testing)

### Submissions
- `POST /api/submissions` - Submit project (team leader only)
- `GET /api/submissions/my/:teamId` - Get submission by team ID
- `PUT /api/submissions/:id` - Update submission (team leader only)
- `GET /api/submissions` - Get all submissions (admin only)

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a Firebase project at https://console.firebase.google.com/
   - Enable Realtime Database
   - Generate a service account key and download the JSON file
   - Set the environment variables in `.env` file:
     ```
     FIREBASE_TYPE=service_account
     FIREBASE_PROJECT_ID=your-project-id
     FIREBASE_PRIVATE_KEY_ID=your-private-key-id
     FIREBASE_PRIVATE_KEY="your-private-key"
     FIREBASE_CLIENT_EMAIL=your-client-email
     FIREBASE_CLIENT_ID=your-client-id
     FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
     ```

4. **Configure JWT Secret**
   - Add to `.env`:
     ```
     JWT_SECRET=your-super-secret-jwt-key-change-in-production
     JWT_EXPIRES_IN=24h
     ```

5. **Configure Razorpay (for payment integration)**
   - Add to `.env`:
     ```
     RAZORPAY_KEY_ID=your-razorpay-key-id
     RAZORPAY_KEY_SECRET=your-razorpay-key-secret
     ```

6. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=5000
NODE_ENV=development

# Firebase Configuration
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# Razorpay (for payment integration)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Firebase Realtime Database URL
FIREBASE_DATABASE_URL=https://innovators-arena-2-0-default-rtdb.asia-southeast1.firebasedatabase.app

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

## Deployment

### Railway Deployment
1. Create a Railway account at https://railway.app/
2. Create a new project
3. Connect your GitHub repository
4. Set environment variables in Railway dashboard
5. Railway will automatically detect the Node.js project and deploy it

### Vercel Frontend Deployment
1. Push frontend code to GitHub
2. Import project to Vercel
3. Set environment variables (if any)
4. Vercel will build and deploy the frontend

## Database Structure

### Users
```
/users
  /{userId}
    - id: string
    - name: string
    - email: string
    - password: string (hashed)
    - phone: string
    - college: string
    - course: string
    - year: string
    - city: string
    - state: string
    - country: string
    - profileCompleted: boolean
    - paymentStatus: string
    - teamId: string
    - role: string
    - linkedin: string
    - github: string
    - createdAt: string
```

### Teams
```
/teams
  /{teamId}
    - id: string
    - teamId: string (IA26- format)
    - teamName: string
    - leaderId: string
    - problemStatementId: string
    - problemStatementTitle: string
    - members: array
    - status: string
    - confirmationStatus: string
    - rejectionReason: string
    - createdAt: string
    - updatedAt: string
```

### Announcements
```
/announcements
  /{announcementId}
    - title: string
    - content: string
    - priority: string
    - status: string
    - createdAt: string
    - updatedAt: string
```

### Payments
```
/payments
  /{paymentId}
    - id: string
    - userId: string
    - amount: number
    - currency: string
    - status: string
    - reference: string
    - createdAt: string
    - updatedAt: string
```

### Submissions
```
/submissions
  /{submissionId}
    - id: string
    - submissionId: string
    - teamId: string
    - projectName: string
    - description: string
    - presentationUrl: string
    - codeUrl: string
    - demoVideoUrl: string
    - status: string
    - submittedAt: string
```

## Testing

Run tests with:
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Firebase for real-time database and authentication
- Express.js for the web framework
- JWT for secure authentication
- All contributors and participants of Innovators Arena 2.0