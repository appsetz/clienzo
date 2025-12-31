# Google Sign-In Setup Guide

## Enable Google Authentication in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **clienzo-27582**
3. Navigate to **Authentication** > **Sign-in method**
4. Click on **Google** provider
5. Toggle **Enable** to ON
6. Set the **Project support email** (your email)
7. Click **Save**

## Authorized Domains

Firebase automatically adds your project domain. For local development:
- `localhost` is already authorized
- For production, add your domain in **Authentication** > **Settings** > **Authorized domains**

## How It Works

- Users can sign in with their Google account
- User profile is automatically created in Firestore on first sign-in
- Name and email are extracted from Google account
- Default plan is set to "free"

## Testing

1. Go to `/login` or `/signup`
2. Click "Sign in with Google" or "Sign up with Google"
3. Select your Google account
4. You'll be redirected to the dashboard

That's it! Google sign-in is now enabled.

