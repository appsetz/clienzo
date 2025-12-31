# Complete Firestore Security Rules for Clienzo

## Copy and Paste These Rules

Go to: **Firebase Console > Firestore Database > Rules tab**

Then paste the rules below and click **"Publish"**

---

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ============================================
    // HELPER FUNCTIONS
    // ============================================
    
    // Check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Check if user owns the resource
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Check if user owns the resource by user_id field
    function ownsResource() {
      return isAuthenticated() && resource.data.user_id == request.auth.uid;
    }
    
    // Check if user is creating resource with their own user_id
    function ownsNewResource() {
      return isAuthenticated() && request.resource.data.user_id == request.auth.uid;
    }
    
    // Validate user_id cannot be changed
    function userIdUnchanged() {
      return request.resource.data.user_id == resource.data.user_id;
    }
    
    // ============================================
    // USERS COLLECTION
    // ============================================
    
    match /users/{userId} {
      // Users can only read their own profile
      allow read: if isOwner(userId);
      
      // Users can create their own profile
      allow create: if isAuthenticated() && 
        request.auth.uid == userId &&
        request.resource.data.keys().hasAll(['id', 'name', 'email', 'plan', 'createdAt']) &&
        request.resource.data.id is string &&
        request.resource.data.name is string &&
        request.resource.data.email is string &&
        request.resource.data.plan in ['free', 'pro', 'agency'] &&
        request.resource.data.createdAt is timestamp;
      
      // Users can update their own profile
      allow update: if isOwner(userId) &&
        // Prevent changing user_id
        request.resource.data.id == resource.data.id &&
        // Validate required fields
        request.resource.data.name is string &&
        request.resource.data.email is string &&
        request.resource.data.plan in ['free', 'pro', 'agency'] &&
        // Optional fields validation
        (!('phone' in request.resource.data) || request.resource.data.phone is string) &&
        (!('location' in request.resource.data) || request.resource.data.location is string) &&
        (!('bio' in request.resource.data) || request.resource.data.bio is string) &&
        (!('agencyName' in request.resource.data) || request.resource.data.agencyName is string) &&
        (!('profileComplete' in request.resource.data) || request.resource.data.profileComplete is bool);
      
      // Users can delete their own profile
      allow delete: if isOwner(userId);
    }
    
    // ============================================
    // CLIENTS COLLECTION
    // ============================================
    
    match /clients/{clientId} {
      // Users can read their own clients
      allow read: if isAuthenticated() && ownsResource();
      
      // Users can create clients with their own user_id
      allow create: if isAuthenticated() && ownsNewResource() &&
        // Validate required fields
        request.resource.data.user_id is string &&
        request.resource.data.name is string &&
        request.resource.data.createdAt is timestamp &&
        request.resource.data.updatedAt is timestamp &&
        // Validate optional fields
        (!('email' in request.resource.data) || request.resource.data.email is string) &&
        (!('phone' in request.resource.data) || request.resource.data.phone is string) &&
        (!('notes' in request.resource.data) || request.resource.data.notes is string);
      
      // Users can update their own clients
      allow update: if isAuthenticated() && ownsResource() &&
        // Prevent changing user_id
        userIdUnchanged() &&
        // Validate required fields
        request.resource.data.name is string &&
        request.resource.data.updatedAt is timestamp &&
        // Validate optional fields
        (!('email' in request.resource.data) || request.resource.data.email is string) &&
        (!('phone' in request.resource.data) || request.resource.data.phone is string) &&
        (!('notes' in request.resource.data) || request.resource.data.notes is string);
      
      // Users can delete their own clients
      allow delete: if isAuthenticated() && ownsResource();
    }
    
    // ============================================
    // PROJECTS COLLECTION
    // ============================================
    
    match /projects/{projectId} {
      // Users can read their own projects
      allow read: if isAuthenticated() && ownsResource();
      
      // Users can create projects with their own user_id
      allow create: if isAuthenticated() && ownsNewResource() &&
        // Validate required fields
        request.resource.data.user_id is string &&
        request.resource.data.client_id is string &&
        request.resource.data.name is string &&
        request.resource.data.status in ['active', 'completed', 'on-hold', 'cancelled'] &&
        request.resource.data.total_amount is number &&
        request.resource.data.total_amount >= 0 &&
        request.resource.data.createdAt is timestamp &&
        request.resource.data.updatedAt is timestamp &&
        // Validate optional fields
        (!('deadline' in request.resource.data) || request.resource.data.deadline is timestamp) &&
        (!('reminder_date' in request.resource.data) || request.resource.data.reminder_date is timestamp);
      
      // Users can update their own projects
      allow update: if isAuthenticated() && ownsResource() &&
        // Prevent changing user_id and client_id
        userIdUnchanged() &&
        request.resource.data.client_id == resource.data.client_id &&
        // Validate required fields
        request.resource.data.name is string &&
        request.resource.data.status in ['active', 'completed', 'on-hold', 'cancelled'] &&
        request.resource.data.total_amount is number &&
        request.resource.data.total_amount >= 0 &&
        request.resource.data.updatedAt is timestamp &&
        // Validate optional fields
        (!('deadline' in request.resource.data) || request.resource.data.deadline is timestamp) &&
        (!('reminder_date' in request.resource.data) || request.resource.data.reminder_date is timestamp);
      
      // Users can delete their own projects
      allow delete: if isAuthenticated() && ownsResource();
    }
    
    // ============================================
    // PAYMENTS COLLECTION
    // ============================================
    
    match /payments/{paymentId} {
      // Users can read their own payments
      allow read: if isAuthenticated() && ownsResource();
      
      // Users can create payments with their own user_id
      allow create: if isAuthenticated() && ownsNewResource() &&
        // Validate required fields
        request.resource.data.user_id is string &&
        request.resource.data.project_id is string &&
        request.resource.data.amount is number &&
        request.resource.data.amount > 0 &&
        request.resource.data.date is timestamp &&
        request.resource.data.createdAt is timestamp &&
        // Validate optional fields
        (!('notes' in request.resource.data) || request.resource.data.notes is string) &&
        (!('payment_type' in request.resource.data) || request.resource.data.payment_type in ['advance', 'partial', 'final']);
      
      // Users can update their own payments
      allow update: if isAuthenticated() && ownsResource() &&
        // Prevent changing user_id and project_id
        userIdUnchanged() &&
        request.resource.data.project_id == resource.data.project_id &&
        // Validate required fields
        request.resource.data.amount is number &&
        request.resource.data.amount > 0 &&
        request.resource.data.date is timestamp &&
        // Validate optional fields
        (!('notes' in request.resource.data) || request.resource.data.notes is string) &&
        (!('payment_type' in request.resource.data) || request.resource.data.payment_type in ['advance', 'partial', 'final']);
      
      // Users can delete their own payments
      allow delete: if isAuthenticated() && ownsResource();
    }
    
    // ============================================
    // DENY ALL OTHER COLLECTIONS
    // ============================================
    
    // Deny access to any other collections
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Security Features

### ✅ Authentication Required
- All operations require user authentication
- No anonymous access allowed

### ✅ Data Ownership
- Users can only access their own data
- `user_id` field is validated and cannot be changed
- Prevents unauthorized data access

### ✅ Field Validation
- Required fields are validated on create/update
- Data types are enforced (string, number, timestamp, bool)
- Enum values are restricted (plan, status, payment_type)
- Numeric values have range checks (amount > 0, total_amount >= 0)

### ✅ Immutable Fields
- `user_id` cannot be changed after creation
- `client_id` in projects cannot be changed
- `project_id` in payments cannot be changed
- `id` in users cannot be changed

### ✅ Optional Fields
- Optional fields are validated if present
- Prevents invalid data types in optional fields

### ✅ Collection Isolation
- All other collections are denied by default
- Only defined collections are accessible

## Collections Protected

1. **users** - User profiles and settings
2. **clients** - Client information
3. **projects** - Project details and status
4. **payments** - Payment records

## Testing Your Rules

After deploying, test with:
1. ✅ Authenticated user can read their own data
2. ✅ Authenticated user can create data with their user_id
3. ✅ Authenticated user can update their own data
4. ✅ Authenticated user cannot access other users' data
5. ✅ Unauthenticated users cannot access any data
6. ✅ Invalid data types are rejected
7. ✅ Immutable fields cannot be changed

