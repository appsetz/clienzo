# Clienzo - Client Management Tool

A modern client and project management SaaS built with Next.js, Firebase, and Three.js.

## Features

### Free Plan
- ✅ Up to 3 Clients
- ✅ Up to 3 Active Projects
- ✅ Basic Dashboard
- ✅ Manual payment entry
- ✅ Web access

### Pro Plan (₹159/month)
- ✅ Unlimited Clients
- ✅ Unlimited Projects
- ✅ Payment Analytics
- ✅ Follow-up Reminders
- ✅ Export Data
- ✅ Revenue Insights
- ✅ Pending Payments Summary

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Authentication + Firestore)
- **3D Graphics**: Three.js, React Three Fiber
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Firebase project created
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Clienzo
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

4. Set up Firebase:

   a. Go to [Firebase Console](https://console.firebase.google.com/)
   
   b. Create a new project or use an existing one
   
   c. Enable Authentication:
      - Go to Authentication > Sign-in method
      - Enable Email/Password authentication
   
   d. Create Firestore Database:
      - Go to Firestore Database
      - Create database in production mode
      - Set up security rules (see below)

5. Set up Firestore Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Clients collection
    match /clients/{clientId} {
      allow read, write: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.user_id == request.auth.uid;
    }
    
    // Projects collection
    match /projects/{projectId} {
      allow read, write: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.user_id == request.auth.uid;
    }
    
    // Payments collection
    match /payments/{paymentId} {
      allow read, write: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.user_id == request.auth.uid;
    }
  }
}
```

6. Create Firestore Indexes:

   **IMPORTANT:** Firestore requires composite indexes for queries with both `where` and `orderBy` clauses.
   
   **Quick Fix:** When you see an index error, click the link in the error message to create it automatically.
   
   **Manual Setup:** Go to Firestore > Indexes and create these composite indexes:
   
   - Collection: `clients`
     - Fields: `user_id` (Ascending), `createdAt` (Descending)
     - [Create this index directly](https://console.firebase.google.com/v1/r/project/clienzo-27582/firestore/indexes?create_composite=Ck1wcm9qZWN0cy9jbGllbnpvLTI3NTgyL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9jbGllbnRzL2luZGV4ZXMvXxABGgsKB3VzZXJfaWQQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXxAC)
   
   - Collection: `projects`
     - Fields: `user_id` (Ascending), `createdAt` (Descending)
     - Fields: `client_id` (Ascending), `createdAt` (Descending)
   
   - Collection: `payments`
     - Fields: `user_id` (Ascending), `date` (Descending)
     - Fields: `project_id` (Ascending), `date` (Descending)
   
   **Note:** See `FIRESTORE_INDEXES.md` for detailed instructions.

7. Run the development server:
```bash
npm run dev
```

8. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
Clienzo/
├── app/                    # Next.js app directory
│   ├── dashboard/          # Dashboard pages
│   ├── clients/            # Client management pages
│   ├── projects/           # Project management pages
│   ├── payments/           # Payment tracking pages
│   ├── login/              # Login page
│   ├── signup/             # Signup page
│   └── layout.tsx          # Root layout
├── components/             # React components
│   ├── layout/             # Layout components (Sidebar, Header)
│   └── landing/            # Landing page components
├── contexts/               # React contexts
│   └── AuthContext.tsx     # Authentication context
├── lib/                    # Utility libraries
│   ├── firebase/           # Firebase configuration and helpers
│   └── plan-limits.ts      # Plan limit utilities
└── public/                 # Static assets
```

## Key Features Implementation

### Authentication
- Email/password authentication via Firebase Auth
- Protected routes with automatic redirect
- User profile management

### Client Management
- CRUD operations for clients
- Plan-based limits (3 clients for free users)
- Client details with contact information

### Project Management
- Create projects linked to clients
- Track project status (active, completed, on-hold, cancelled)
- Set deadlines and reminders (Pro feature)
- Project detail pages with payment tracking

### Payment Tracking
- Record payments per project
- Calculate pending amounts
- Payment history
- Monthly revenue insights (Pro feature)

### Dashboard
- Overview statistics
- Recent projects
- Upcoming reminders (Pro feature)
- Quick navigation

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- etc.

## Environment Variables

All Firebase configuration should be set in `.env.local`:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## License

This project is private and proprietary.

## Support

For issues and questions, please contact: hello@clienzo.com

