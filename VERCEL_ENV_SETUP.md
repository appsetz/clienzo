# Vercel Environment Variables Setup

## Quick Setup Guide

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each of the following variables:

### Required Environment Variables

| Variable Name | Value |
|--------------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyD3yB-08nniPxwgAZPwqZT1OqF9TYtZgNQ` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `clienzo-27582.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `clienzo-27582` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `clienzo-27582.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `1001902672676` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:1001902672676:web:83ce12494daec2a1c581b1` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | `G-6YB7CER2QB` |

## Steps to Add in Vercel

1. **Log in to Vercel** and select your project
2. Click on **Settings** in the top navigation
3. Click on **Environment Variables** in the left sidebar
4. Click **Add New** button
5. For each variable:
   - **Key**: Enter the variable name (e.g., `NEXT_PUBLIC_FIREBASE_API_KEY`)
   - **Value**: Enter the corresponding value from the table above
   - **Environment**: Select **Production**, **Preview**, and **Development** (or just Production if you prefer)
   - Click **Save**
6. Repeat for all 7 variables
7. **Redeploy** your application after adding all variables

## Copy-Paste Format

You can copy this directly into Vercel's bulk import (if available) or add them one by one:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD3yB-08nniPxwgAZPwqZT1OqF9TYtZgNQ
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=clienzo-27582.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=clienzo-27582
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=clienzo-27582.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1001902672676
NEXT_PUBLIC_FIREBASE_APP_ID=1:1001902672676:web:83ce12494daec2a1c581b1
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-6YB7CER2QB
```

## Important Notes

- All variables start with `NEXT_PUBLIC_` which makes them available in the browser
- After adding environment variables, you **must redeploy** for changes to take effect
- These values are already in your code as fallbacks, but it's best practice to use environment variables
- The `.env.example` file in your project root contains these same values for reference

## Verification

After deployment, you can verify the environment variables are working by:
1. Checking the Vercel deployment logs for any Firebase initialization errors
2. Testing the app - if Firebase connects successfully, the variables are set correctly

