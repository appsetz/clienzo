# Firestore Rules & Indexes for All Dashboard Types

This document explains the Firestore security rules and indexes that support all three dashboard types: **Freelancer**, **Agency**, and **Business**.

## Overview

All three dashboard types use the same data collections (`clients`, `projects`, `payments`) with `user_id` ownership-based access control. This ensures secure multi-tenant data isolation while allowing shared business logic.

## Collections & Access Patterns

### 1. **Clients Collection** (`clients`)
- **Used by**: All three dashboard types
- **Freelancer**: Their clients
- **Agency**: Their clients  
- **Business**: Their customers
- **Query Pattern**: `where("user_id", "==", userId), orderBy("createdAt", "desc")`
- **Index Required**: `clients: user_id (ASC), createdAt (DESC)`

### 2. **Projects Collection** (`projects`)
- **Used by**: All three dashboard types
- **Freelancer**: Their projects
- **Agency**: Their projects (can assign `team_members`)
- **Business**: Their orders
- **Query Patterns**:
  - `where("user_id", "==", userId), orderBy("createdAt", "desc")` - Dashboard listing
  - `where("client_id", "==", clientId), orderBy("createdAt", "desc")` - Client's projects
- **Indexes Required**:
  - `projects: user_id (ASC), createdAt (DESC)`
  - `projects: client_id (ASC), createdAt (DESC)`

### 3. **Payments Collection** (`payments`)
- **Used by**: All three dashboard types
- **Query Patterns**:
  - `where("user_id", "==", userId), orderBy("date", "desc")` - Dashboard listing
  - `where("project_id", "==", projectId), orderBy("date", "desc")` - Project's payments
- **Indexes Required**:
  - `payments: user_id (ASC), date (DESC)`
  - `payments: project_id (ASC), date (DESC)`

### 4. **Team Members Collection** (`team_members`)
- **Used by**: Agency Dashboard only
- **Query Pattern**: `where("agency_id", "==", agencyId), orderBy("createdAt", "desc")`
- **Index Required**: `team_members: agency_id (ASC), createdAt (DESC)`

### 5. **Reviews Collection** (`reviews`)
- **Used by**: All dashboard types (for submitting reviews)
- **Query Pattern**: `where("approved", "==", true), orderBy("createdAt", "desc")` - Public read
- **Index Required**: `reviews: approved (ASC), createdAt (DESC)`

## Security Rules Summary

### Universal Rules (All User Types)
- **Clients**: Users can only read/write their own clients (`user_id` match)
- **Projects**: Users can only read/write their own projects (`user_id` match)
- **Payments**: Users can only read/write their own payments (`user_id` match)

### Agency-Specific Rules
- **Team Members**: Only agencies can create/manage team members (`agency_id` match)
- **Projects with Team Members**: Agencies can assign up to 3 team members per project

### Public Rules
- **Reviews**: Anyone can read approved reviews (for landing page display)

## Indexes Configuration

All required indexes are defined in `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "clients",
      "fields": [
        { "fieldPath": "user_id", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "projects",
      "fields": [
        { "fieldPath": "user_id", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "projects",
      "fields": [
        { "fieldPath": "client_id", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "payments",
      "fields": [
        { "fieldPath": "user_id", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "payments",
      "fields": [
        { "fieldPath": "project_id", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "team_members",
      "fields": [
        { "fieldPath": "agency_id", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "reviews",
      "fields": [
        { "fieldPath": "approved", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

## Deployment

### Deploy Rules
```bash
firebase deploy --only firestore:rules
```

### Deploy Indexes
```bash
firebase deploy --only firestore:indexes
```

## Testing

All three dashboard types should be able to:
1. ✅ Read their own clients, projects, and payments
2. ✅ Create new clients, projects, and payments
3. ✅ Update their own data
4. ✅ Delete their own data

Agencies additionally can:
5. ✅ Manage team members
6. ✅ Assign team members to projects (max 3)

## Notes

- All rules use `user_id` field for ownership validation, making them universal across all user types
- The `team_members` field in projects is optional and only used by agencies
- All indexes are composite indexes required for queries with `where` + `orderBy` on different fields
- Rules prevent users from accessing other users' data through strict `user_id` validation

