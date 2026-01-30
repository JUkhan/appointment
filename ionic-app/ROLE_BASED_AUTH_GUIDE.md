# Role-Based UI Authorization Guide

This guide explains how to use the role-based authorization system in your Ionic application.

## Overview

The system automatically:
- ✅ Extracts the `role` claim from your JWT `access_token`
- ✅ Detects role changes when the token is refreshed
- ✅ Notifies your application about role changes
- ✅ Provides utilities for role-based UI rendering

## Table of Contents

1. [Quick Start](#quick-start)
2. [Core Concepts](#core-concepts)
3. [Usage Patterns](#usage-patterns)
4. [API Reference](#api-reference)
5. [Examples](#examples)

---

## Quick Start

### 1. Access user role in any component

```tsx
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { userRole, hasRole } = useAuth();

  return (
    <div>
      <p>Your role: {userRole}</p>
      {hasRole('admin') && <AdminButton />}
    </div>
  );
}
```

### 2. Conditionally render UI based on role

```tsx
import RoleGuard from '../components/RoleGuard';

function MyPage() {
  return (
    <>
      <RoleGuard allowedRoles="admin">
        <AdminPanel />
      </RoleGuard>

      <RoleGuard allowedRoles={['admin', 'doctor']}>
        <MedicalStaffContent />
      </RoleGuard>
    </>
  );
}
```

### 3. Protect routes by role

```tsx
import RoleProtectedRoute from '../components/RoleProtectedRoute';

<RoleProtectedRoute
  path="/admin"
  allowedRoles="admin"
  component={AdminDashboard}
  redirectTo="/unauthorized"
/>
```

### 4. Listen for role changes

```tsx
import { useRole } from '../hooks/useRole';

function MyComponent() {
  const { onRoleChange } = useRole();

  useEffect(() => {
    const unsubscribe = onRoleChange((event) => {
      console.log('Role changed from', event.oldRole, 'to', event.newRole);
      // Handle role change: show notification, redirect, refresh data, etc.
    });

    return unsubscribe; // Cleanup on unmount
  }, [onRoleChange]);
}
```

---

## Core Concepts

### How Role Detection Works

1. **Login**: When user logs in, the role is extracted from the `access_token` JWT
2. **Token Refresh**: When the token is refreshed (on 401 errors), the system checks if the role changed
3. **Notification**: If the role changed, all subscribers are notified
4. **UI Update**: Your components can react to role changes automatically

### Role Flow Diagram

```
User Login
    ↓
JWT Token Received (contains 'role' claim)
    ↓
Role Extracted & Stored in AuthContext
    ↓
User Interacts with App
    ↓
Token Expires → 401 Error
    ↓
Token Refresh Request
    ↓
New Token Received
    ↓
Compare Old Role vs New Role
    ↓
If Different → Notify Subscribers
    ↓
Components React to Role Change
```

---

## Usage Patterns

### Pattern 1: Simple Role Check

```tsx
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const { userRole, hasRole } = useAuth();

  if (hasRole('admin')) {
    return <AdminDashboard />;
  }

  if (hasRole('doctor')) {
    return <DoctorDashboard />;
  }

  return <PatientDashboard />;
}
```

### Pattern 2: Multiple Role Check

```tsx
import { useAuth } from '../context/AuthContext';

function MedicalRecords() {
  const { hasRole } = useAuth();

  // Allow both admin and doctor
  if (!hasRole(['admin', 'doctor'])) {
    return <p>Access Denied</p>;
  }

  return <MedicalRecordsContent />;
}
```

### Pattern 3: RoleGuard Component

```tsx
import RoleGuard from '../components/RoleGuard';

function Toolbar() {
  return (
    <IonToolbar>
      {/* Only admins see this button */}
      <RoleGuard allowedRoles="admin">
        <IonButton>Admin Settings</IonButton>
      </RoleGuard>

      {/* Admin OR Doctor see this */}
      <RoleGuard allowedRoles={['admin', 'doctor']}>
        <IonButton>Medical Reports</IonButton>
      </RoleGuard>

      {/* Everyone except admin */}
      <RoleGuard
        allowedRoles="admin"
        fallback={<IonButton>Book Appointment</IonButton>}
      >
        {/* Nothing here, using fallback for non-admins */}
      </RoleGuard>
    </IonToolbar>
  );
}
```

### Pattern 4: useRole Hook with Helpers

```tsx
import { useRole } from '../hooks/useRole';

function UserMenu() {
  const { isAdmin, isDoctor, isPatient } = useRole();

  return (
    <IonMenu>
      {isAdmin && <IonItem>User Management</IonItem>}
      {isDoctor && <IonItem>Patient List</IonItem>}
      {isPatient && <IonItem>My Appointments</IonItem>}
    </IonMenu>
  );
}
```

### Pattern 5: Role-Based Navigation

```tsx
import { useRole } from '../hooks/useRole';
import { useHistory } from 'react-router-dom';

function LoginSuccess() {
  const { userRole } = useRole();
  const history = useHistory();

  useEffect(() => {
    // Redirect based on role after login
    switch (userRole) {
      case 'admin':
        history.push('/admin/dashboard');
        break;
      case 'doctor':
        history.push('/doctor/appointments');
        break;
      case 'patient':
        history.push('/patient/book');
        break;
      default:
        history.push('/');
    }
  }, [userRole, history]);

  return <IonSpinner />;
}
```

### Pattern 6: Role Change Handling

```tsx
import { useRole } from '../hooks/useRole';
import { useIonToast } from '@ionic/react';

function App() {
  const { onRoleChange } = useRole();
  const [presentToast] = useIonToast();

  useEffect(() => {
    const unsubscribe = onRoleChange((event) => {
      // Show notification
      presentToast({
        message: `Your role changed from ${event.oldRole} to ${event.newRole}`,
        duration: 3000,
        color: 'warning',
      });

      // Refresh data
      refetchUserData();

      // Redirect if needed
      if (event.newRole === 'patient' && event.oldRole === 'doctor') {
        history.push('/patient/dashboard');
      }
    });

    return unsubscribe;
  }, [onRoleChange]);
}
```

### Pattern 7: Conditional Tab Bar

```tsx
import { useRole } from '../hooks/useRole';

function AppTabs() {
  const { isAdmin, isDoctor, isPatient } = useRole();

  return (
    <IonTabs>
      <IonTabBar>
        {/* Everyone sees these */}
        <IonTabButton tab="home" href="/tabs/home">
          <IonLabel>Home</IonLabel>
        </IonTabButton>

        {/* Only doctors and admins */}
        {(isDoctor || isAdmin) && (
          <IonTabButton tab="patients" href="/tabs/patients">
            <IonLabel>Patients</IonLabel>
          </IonTabButton>
        )}

        {/* Only admins */}
        {isAdmin && (
          <IonTabButton tab="admin" href="/tabs/admin">
            <IonLabel>Admin</IonLabel>
          </IonTabButton>
        )}

        {/* Only patients */}
        {isPatient && (
          <IonTabButton tab="book" href="/tabs/book">
            <IonLabel>Book</IonLabel>
          </IonTabButton>
        )}
      </IonTabBar>
    </IonTabs>
  );
}
```

---

## API Reference

### `useAuth()` Hook

Returns auth context with role information.

```typescript
const {
  userRole,           // Current user role (string | null)
  hasRole,            // Function to check if user has role(s)
  isAuthenticated,    // Boolean - is user logged in
  userId,             // Current user ID
  login,              // Login function
  logout,             // Logout function
  onRoleChange,       // Subscribe to role changes
  refreshRole,        // Manually refresh role from token
} = useAuth();
```

**Methods:**

- `hasRole(role: string | string[]): boolean`
  - Check if user has specific role(s)
  - Single role: `hasRole('admin')`
  - Multiple roles (OR): `hasRole(['admin', 'doctor'])`

- `onRoleChange(callback: (event) => void): () => void`
  - Subscribe to role change events
  - Returns unsubscribe function
  - Event object: `{ oldRole, newRole, timestamp }`

- `refreshRole(): Promise<void>`
  - Manually refresh role from current access token
  - Useful if you need to force a role check

### `useRole()` Hook

Enhanced hook with helper methods.

```typescript
const {
  userRole,           // Current user role
  hasRole,            // Check if user has role(s)
  onRoleChange,       // Subscribe to role changes
  roleChangeCount,    // Number of times role has changed
  isAdmin,            // Boolean - is user admin
  isDoctor,           // Boolean - is user doctor
  isPatient,          // Boolean - is user patient
  isReceptionist,     // Boolean - is user receptionist
} = useRole();
```

### `<RoleGuard>` Component

Conditionally renders children based on user role.

**Props:**

```typescript
interface RoleGuardProps {
  allowedRoles: string | string[];  // Required role(s)
  children: ReactNode;              // Content to show if authorized
  fallback?: ReactNode;             // Content to show if not authorized
  requireAll?: boolean;             // If true, must have ALL roles (default: false)
}
```

**Examples:**

```tsx
// Single role
<RoleGuard allowedRoles="admin">
  <AdminContent />
</RoleGuard>

// Multiple roles (OR)
<RoleGuard allowedRoles={['admin', 'doctor']}>
  <MedicalContent />
</RoleGuard>

// With fallback
<RoleGuard allowedRoles="admin" fallback={<p>Not authorized</p>}>
  <AdminPanel />
</RoleGuard>

// Require ALL roles (AND)
<RoleGuard allowedRoles={['admin', 'superuser']} requireAll>
  <SuperAdminPanel />
</RoleGuard>
```

### `<RoleProtectedRoute>` Component

Route that requires specific role(s).

**Props:**

```typescript
interface RoleProtectedRouteProps extends RouteProps {
  allowedRoles: string | string[];  // Required role(s)
  redirectTo?: string;              // Where to redirect if unauthorized
  component?: ComponentType;        // Component to render
}
```

**Examples:**

```tsx
// Admin-only route
<RoleProtectedRoute
  path="/admin"
  allowedRoles="admin"
  component={AdminDashboard}
/>

// Multiple roles allowed
<RoleProtectedRoute
  path="/medical-records"
  allowedRoles={['admin', 'doctor']}
  component={MedicalRecords}
  redirectTo="/unauthorized"
/>

// With custom redirect
<RoleProtectedRoute
  path="/doctor/dashboard"
  allowedRoles="doctor"
  component={DoctorDashboard}
  redirectTo="/access-denied"
/>
```

### JWT Utilities

Low-level utilities for working with JWT tokens.

```typescript
import {
  decodeJWT,
  extractRole,
  extractUserId,
  isTokenExpired,
  getAllClaims,
} from '../utils/jwtUtils';

// Decode entire JWT
const payload = decodeJWT(token);

// Extract role
const role = extractRole(token);

// Extract user ID
const userId = extractUserId(token);

// Check if expired
const expired = isTokenExpired(token);

// Get all claims
const claims = getAllClaims(token);
```

---

## Examples

See `src/examples/RoleBasedUIExample.tsx` for a comprehensive demo page showing all usage patterns.

### Real-World Example: Appointment Booking

```tsx
import { useRole } from '../hooks/useRole';
import RoleGuard from '../components/RoleGuard';

function AppointmentPage() {
  const { isPatient, isReceptionist, isDoctor } = useRole();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Appointments</IonTitle>

          {/* Doctor can view all appointments */}
          <RoleGuard allowedRoles="doctor">
            <IonButtons slot="end">
              <IonButton>View All</IonButton>
            </IonButtons>
          </RoleGuard>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Patient: Book new appointment */}
        {isPatient && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Book Appointment</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <AppointmentBookingForm />
            </IonCardContent>
          </IonCard>
        )}

        {/* Receptionist: Manage appointments */}
        {isReceptionist && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Manage Appointments</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <AppointmentManagement />
            </IonCardContent>
          </IonCard>
        )}

        {/* Doctor: View schedule */}
        {isDoctor && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Your Schedule</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <DoctorSchedule />
            </IonCardContent>
          </IonCard>
        )}

        {/* Everyone: View their appointments */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              {isPatient ? 'My Appointments' : 'Appointments'}
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <AppointmentList />
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
}
```

---

## Best Practices

### ✅ DO

- Use `useRole()` hook for cleaner code with helper methods
- Subscribe to role changes to handle role updates gracefully
- Use `RoleGuard` for simple show/hide UI elements
- Use `RoleProtectedRoute` for entire pages that require specific roles
- Handle role changes by showing notifications or redirecting users
- Check roles on both frontend (UI) and backend (API security)

### ❌ DON'T

- Don't rely solely on frontend role checks for security (always validate on backend)
- Don't forget to unsubscribe from role change listeners (causes memory leaks)
- Don't hardcode role names everywhere (consider using constants)
- Don't ignore role changes - handle them gracefully

### Security Note

**Frontend role checks are for UI/UX only!** Always validate permissions on the backend:

```typescript
// ❌ BAD - Only checking on frontend
if (hasRole('admin')) {
  deleteUser(userId); // No backend validation
}

// ✅ GOOD - Backend validates too
if (hasRole('admin')) {
  try {
    await api.deleteUser(userId); // Backend checks if user is admin
  } catch (error) {
    // Handle unauthorized error
  }
}
```

---

## Troubleshooting

### Role is null/undefined

**Problem:** `userRole` is `null` even though you're logged in.

**Solutions:**
1. Check that your JWT token has a `role` claim
2. Verify the claim name is exactly `role` (case-sensitive)
3. Check browser console for JWT decoding errors
4. Ensure `AuthProviderWithRoleSync` is wrapping your app

### Role doesn't update after token refresh

**Problem:** Role changes on backend but doesn't update in UI.

**Solutions:**
1. Ensure you're using `AuthProviderWithRoleSync` (not `AuthProvider`)
2. Check that `setRoleChangeNotifier` is being called
3. Verify token refresh is working correctly
4. Check browser console for errors during token refresh

### Role change events not firing

**Problem:** `onRoleChange` callback never gets called.

**Solutions:**
1. Role only changes when token is refreshed, not on every API call
2. Test by waiting for token to expire (or manually trigger refresh)
3. Ensure you're not unsubscribing too early
4. Check that role actually changed (old role ≠ new role)

---

## Migration Guide

If you have existing authentication code:

### 1. Update AuthProvider import

```tsx
// Before
import { AuthProvider } from './context/AuthContext';

// After
import { AuthProviderWithRoleSync } from './components/AuthProviderWithRoleSync';
```

### 2. Use role in your components

```tsx
// Before - no role support
const { isAuthenticated, userId } = useAuth();

// After - with role support
const { isAuthenticated, userId, userRole, hasRole } = useAuth();
```

### 3. Replace custom role checks

```tsx
// Before - custom implementation
const [isAdmin, setIsAdmin] = useState(false);

// After - built-in
const { isAdmin } = useRole();
```

---

## Support

For issues or questions:
1. Check the examples in `src/examples/RoleBasedUIExample.tsx`
2. Review this guide's troubleshooting section
3. Check browser console for errors
4. Verify your JWT token structure

---

## Summary

You now have a complete role-based authorization system that:

✅ Automatically extracts roles from JWT tokens
✅ Detects role changes during token refresh
✅ Notifies your app when roles change
✅ Provides easy-to-use components and hooks
✅ Supports multiple roles and complex conditions
✅ Works seamlessly with your existing auth system

Happy coding! 🚀
