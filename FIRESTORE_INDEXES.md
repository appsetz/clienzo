# Firestore Indexes Setup Guide

Firestore requires composite indexes when you query with both `where` and `orderBy` clauses on different fields. This guide will help you create all necessary indexes.

## Quick Setup (Recommended)

We've included a `firestore.indexes.json` file in the project root. You can deploy all indexes at once using Firebase CLI:

```bash
# Install Firebase CLI if you haven't already
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy indexes
firebase deploy --only firestore:indexes
```

This will create all required indexes automatically!

## Quick Fix

The error message provides a direct link to create the index. Simply click the link in the error message, or use the links below.

## Required Indexes

### 1. Clients Collection

**Index 1: `user_id` + `createdAt`**
- Collection: `clients`
- Fields:
  - `user_id` (Ascending)
  - `createdAt` (Descending)

**Create this index:**
[Click here to create the index](https://console.firebase.google.com/v1/r/project/clienzo-27582/firestore/indexes?create_composite=Ck1wcm9qZWN0cy9jbGllbnpvLTI3NTgyL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9jbGllbnRzL2luZGV4ZXMvXxABGgsKB3VzZXJfaWQQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXxAC)

### 2. Projects Collection

**Index 1: `user_id` + `createdAt`**
- Collection: `projects`
- Fields:
  - `user_id` (Ascending)
  - `createdAt` (Descending)

**Index 2: `client_id` + `createdAt`** (if filtering by client)
- Collection: `projects`
- Fields:
  - `client_id` (Ascending)
  - `createdAt` (Descending)

### 3. Payments Collection

**Index 1: `user_id` + `date`**
- Collection: `payments`
- Fields:
  - `user_id` (Ascending)
  - `date` (Descending)

**Index 2: `project_id` + `date`** (if filtering by project)
- Collection: `payments`
- Fields:
  - `project_id` (Ascending)
  - `date` (Descending)

## How to Create Indexes Manually

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `clienzo-27582`
3. Navigate to **Firestore Database** > **Indexes** tab
4. Click **Create Index**
5. For each index above:
   - Select the collection name
   - Add fields in the order specified
   - Set the sort order (Ascending/Descending) as shown
   - Click **Create**

## Automatic Index Creation

Firebase will automatically prompt you to create indexes when you encounter this error. You can:

1. Click the link in the error message
2. Or wait for Firebase to detect the query and show a prompt in the console

## After Creating Indexes

- Indexes typically take a few minutes to build
- Once built, the queries will work without errors
- You can check index status in the Firebase Console
- If using Firebase CLI, you'll see the deployment status in the terminal

## Using firestore.indexes.json

The project includes a `firestore.indexes.json` file that defines all required indexes. This file can be:

1. **Deployed via Firebase CLI** (recommended):
   ```bash
   firebase deploy --only firestore:indexes
   ```

2. **Used as reference** when creating indexes manually in the Firebase Console

3. **Version controlled** so your team always has the correct index definitions

## Troubleshooting

If you still see errors after creating indexes:
1. Wait a few minutes for indexes to finish building
2. Refresh your application
3. Check the Firebase Console to verify index status
4. Ensure all field names match exactly (case-sensitive)

