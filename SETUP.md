# Clienzo Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Firebase**
   - Create a Firebase project at https://console.firebase.google.com/
   - Enable Authentication (Email/Password)
   - Create Firestore Database
   - Copy your Firebase config values

3. **Create `.env.local` file**
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   ```

4. **Set Firestore Security Rules**
   - Go to Firestore > Rules
   - Copy the rules from `firestore.rules` file
   - Paste and publish

5. **Create Firestore Indexes**
   Go to Firestore > Indexes and create:
   
   - Collection: `clients`
     - Fields: `user_id` (Ascending), `createdAt` (Descending)
   
   - Collection: `projects`
     - Fields: `user_id` (Ascending), `createdAt` (Descending)
     - Fields: `client_id` (Ascending), `createdAt` (Descending)
   
   - Collection: `payments`
     - Fields: `user_id` (Ascending), `date` (Descending)
     - Fields: `project_id` (Ascending), `date` (Descending)

6. **Run Development Server**
   ```bash
   npm run dev
   ```

7. **Open Browser**
   Navigate to http://localhost:3000

## Database Schema

### Users Collection
```
users/{userId}
  - id: string
  - name: string
  - email: string
  - plan: "free" | "pro" | "agency"
  - createdAt: timestamp
```

### Clients Collection
```
clients/{clientId}
  - id: string
  - user_id: string
  - name: string
  - email?: string
  - phone?: string
  - notes?: string
  - createdAt: timestamp
  - updatedAt: timestamp
```

### Projects Collection
```
projects/{projectId}
  - id: string
  - client_id: string
  - user_id: string
  - name: string
  - status: "active" | "completed" | "on-hold" | "cancelled"
  - deadline?: timestamp
  - total_amount: number
  - reminder_date?: timestamp (Pro only)
  - createdAt: timestamp
  - updatedAt: timestamp
```

### Payments Collection
```
payments/{paymentId}
  - id: string
  - project_id: string
  - user_id: string
  - amount: number
  - date: timestamp
  - notes?: string
  - createdAt: timestamp
```

## Plan Limits

### Free Plan
- Max 3 Clients
- Max 3 Active Projects
- Basic Dashboard
- No Reminders
- No Analytics
- No Exports

### Pro Plan (₹159/month)
- Unlimited Clients
- Unlimited Projects
- Payment Analytics
- Follow-up Reminders
- Export Data
- Revenue Insights

## Troubleshooting

### "Firebase: Error (auth/network-request-failed)"
- Check your internet connection
- Verify Firebase config in `.env.local`

### "Missing or insufficient permissions"
- Check Firestore security rules
- Ensure user is authenticated

### "Index not found"
- Create the required composite indexes in Firestore
- Wait a few minutes for indexes to build

### Build Errors
- Run `npm install` again
- Delete `node_modules` and `.next` folder, then reinstall

## Next Steps

1. Test authentication (signup/login)
2. Create a test client
3. Create a test project
4. Add a payment
5. Check dashboard stats

For more details, see README.md

