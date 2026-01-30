# Role-Based UI Authorization - Implementation Summary

## What Was Implemented

Your Ionic application now has a complete **role-based UI authorization system** that:

✅ **Extracts the `role` claim** from JWT `access_token`
✅ **Detects role changes** when tokens are refreshed
✅ **Notifies the application** when role changes occur
✅ **Provides easy-to-use utilities** for role-based UI rendering

---

## New Files Created

### 1. Core Utilities

- **`src/utils/jwtUtils.ts`**
  - JWT decoding utilities
  - Extract role, user ID, and other claims
  - Token expiration checking
  - Functions: `decodeJWT()`, `extractRole()`, `extractUserId()`, `isTokenExpired()`, `getAllClaims()`

### 2. Components

- **`src/components/RoleGuard.tsx`**
  - Conditionally render UI based on user role
  - Supports single or multiple roles
  - Optional fallback content
  - Example: `<RoleGuard allowedRoles="admin"><AdminPanel /></RoleGuard>`

- **`src/components/RoleProtectedRoute.tsx`**
  - Route component that requires specific role(s)
  - Redirects unauthorized users
  - Example: `<RoleProtectedRoute path="/admin" allowedRoles="admin" component={AdminPage} />`

- **`src/components/AuthProviderWithRoleSync.tsx`**
  - Enhanced AuthProvider that syncs role changes
  - Automatically connects apiService token refresh with AuthContext
  - Replaces the standard AuthProvider in App.tsx

### 3. Hooks

- **`src/hooks/useRole.ts`**
  - Custom hook with role helper methods
  - Provides: `isAdmin`, `isDoctor`, `isPatient`, `isReceptionist`
  - Subscribe to role changes
  - Track role change count

### 4. Documentation

- **`ROLE_BASED_AUTH_GUIDE.md`** - Complete guide with examples
- **`ROLE_AUTH_QUICK_REFERENCE.md`** - Quick reference card
- **`IMPLEMENTATION_SUMMARY.md`** - This file

### 5. Examples

- **`src/examples/RoleBasedUIExample.tsx`**
  - Comprehensive demo page
  - Shows all usage patterns
  - 5+ different examples

### 6. Central Export

- **`src/role-auth/index.ts`**
  - Single import for all role-auth features
  - Example: `import { useRole, RoleGuard } from '../role-auth';`

---

## Modified Files

### 1. `src/types/index.ts`
**Added:**
- `UserRole` type
- `RoleChangeEvent` interface
- `RoleChangeCallback` type

### 2. `src/context/AuthContext.tsx`
**Added:**
- `userRole` state
- `hasRole()` function
- `onRoleChange()` subscription method
- `refreshRole()` method
- Role extraction on login and auth check

**Updated:**
- AuthContextType interface with new role-related properties
- Login, logout, and checkAuthStatus to handle roles

### 3. `src/services/apiService.ts`
**Added:**
- Role change detection during token refresh
- `setRoleChangeNotifier()` export
- Role comparison (old vs new) after refresh
- Automatic notification when role changes

### 4. `src/App.tsx`
**Updated:**
- Replaced `AuthProvider` with `AuthProviderWithRoleSync`
- This enables automatic role change detection

---

## How It Works

### 1. Login Flow
```
User logs in
  → Receives JWT access_token with 'role' claim
  → Role extracted and stored in AuthContext
  → userRole state updated
  → UI renders based on role
```

### 2. Token Refresh Flow
```
Token expires → 401 error
  → apiService intercepts
  → Gets old role from current token
  → Requests new token with refresh_token
  → Gets new role from refreshed token
  → Compares old role vs new role
  → If different: calls notifier
  → AuthContext.refreshRole() called
  → Role state updated
  → All subscribers notified
  → UI re-renders
```

### 3. Role Change Notification Flow
```
Component subscribes via onRoleChange()
  → Role changes (token refresh)
  → All callbacks executed
  → Component can: show notification, redirect, refresh data
  → Component unsubscribes on unmount
```

---

## Usage Examples

### Example 1: Simple Role Check
```tsx
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { userRole, hasRole } = useAuth();

  return (
    <div>
      <p>Your role: {userRole}</p>
      {hasRole('admin') && <button>Admin Only</button>}
    </div>
  );
}
```

### Example 2: RoleGuard Component
```tsx
import RoleGuard from '../components/RoleGuard';

function Dashboard() {
  return (
    <>
      <RoleGuard allowedRoles="admin">
        <AdminPanel />
      </RoleGuard>

      <RoleGuard allowedRoles={['admin', 'doctor']}>
        <MedicalRecords />
      </RoleGuard>
    </>
  );
}
```

### Example 3: Role Change Listener
```tsx
import { useRole } from '../hooks/useRole';

function App() {
  const { onRoleChange } = useRole();

  useEffect(() => {
    const unsubscribe = onRoleChange((event) => {
      console.log('Role changed!', event.oldRole, '→', event.newRole);
      // Show notification, redirect user, etc.
    });

    return unsubscribe; // Cleanup
  }, [onRoleChange]);
}
```

### Example 4: Protected Route
```tsx
import RoleProtectedRoute from '../components/RoleProtectedRoute';

<RoleProtectedRoute
  path="/admin"
  allowedRoles="admin"
  component={AdminDashboard}
  redirectTo="/unauthorized"
/>
```

### Example 5: Role Helpers
```tsx
import { useRole } from '../hooks/useRole';

function Menu() {
  const { isAdmin, isDoctor, isPatient } = useRole();

  return (
    <nav>
      {isAdmin && <a href="/admin">Admin</a>}
      {isDoctor && <a href="/patients">Patients</a>}
      {isPatient && <a href="/appointments">My Appointments</a>}
    </nav>
  );
}
```

---

## Testing

### How to Test Role Changes

Role changes occur when the access token is refreshed. To test:

1. **Wait for natural token expiration** (depends on your backend JWT settings)
2. **Reduce token expiration** on your backend (e.g., 1 minute) for testing
3. **Manually trigger refresh** by making an API call after token expires
4. **Watch console logs** for "Role changed" messages

### What to Look For

Check browser console:
```
Role changed after token refresh: { oldRole: 'patient', newRole: 'doctor' }
Role changed: { oldRole: 'patient', newRole: 'doctor' }
```

### Testing Checklist

- [ ] Login shows correct role
- [ ] UI elements appear/disappear based on role
- [ ] RoleGuard components work correctly
- [ ] Protected routes redirect properly
- [ ] Role change callbacks fire when token refreshes
- [ ] Console logs show role changes
- [ ] No errors in console

---

## Integration with Your Backend

### Requirements

Your backend must:

1. **Include `role` claim in JWT access token**
   ```json
   {
     "user_id": 123,
     "role": "admin",
     "exp": 1234567890
   }
   ```

2. **Return new access_token on refresh**
   ```
   POST /refresh
   Authorization: Bearer {refresh_token}

   Response:
   {
     "access_token": "new_jwt_token_here"
   }
   ```

3. **Allow role changes between refreshes**
   - If a user's role changes on backend, the next token refresh should return the new role

### Backend Example (Python/Flask)

```python
from flask_jwt_extended import create_access_token

# Login endpoint
@app.route('/login', methods=['POST'])
def login():
    user = authenticate_user(username, password)
    access_token = create_access_token(
        identity=user.id,
        additional_claims={
            'role': user.role,  # Include role claim
            'client_id': user.client_id
        }
    )
    return {
        'access_token': access_token,
        'refresh_token': create_refresh_token(identity=user.id),
        'user_id': user.id
    }

# Refresh endpoint
@app.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    user = get_user(user_id)

    # Create new access token with current role
    # If role changed in DB, new token will have updated role
    access_token = create_access_token(
        identity=user_id,
        additional_claims={
            'role': user.role,  # Latest role from database
            'client_id': user.client_id
        }
    )
    return {'access_token': access_token}
```

---

## Common Role Names

While you can use any role names, here are common conventions:

- `admin` - Full system access
- `doctor` - Medical staff
- `patient` - End users/patients
- `receptionist` - Front desk staff
- `nurse` - Nursing staff
- `manager` - Department managers
- `superadmin` - Super administrator

You can customize role names to match your system.

---

## Next Steps

### 1. Define Your Roles

Decide what roles your system needs:
- What permissions does each role have?
- What UI should each role see?
- What actions can each role perform?

### 2. Update Backend

Ensure your backend includes the `role` claim in JWT tokens.

### 3. Implement UI Logic

Start using role-based components in your pages:

```tsx
// Example: Update BookAppointmentPage.tsx
import { useRole } from '../hooks/useRole';
import RoleGuard from '../components/RoleGuard';

function BookAppointmentPage() {
  const { isPatient, isReceptionist } = useRole();

  return (
    <IonPage>
      {/* Patients book for themselves */}
      {isPatient && <BookForSelfForm />}

      {/* Receptionists book for others */}
      {isReceptionist && <BookForPatientForm />}

      {/* Admins see everything */}
      <RoleGuard allowedRoles="admin">
        <AdminControls />
      </RoleGuard>
    </IonPage>
  );
}
```

### 4. Add Role Change Handling

In your main App component, handle role changes:

```tsx
import { useRole } from '../hooks/useRole';
import { useIonToast } from '@ionic/react';

function App() {
  const { onRoleChange } = useRole();
  const [presentToast] = useIonToast();

  useEffect(() => {
    return onRoleChange((event) => {
      presentToast({
        message: `Your access level changed to: ${event.newRole}`,
        duration: 3000,
        color: 'warning',
      });
    });
  }, [onRoleChange, presentToast]);

  // ... rest of app
}
```

### 5. Test Thoroughly

- Test each role separately
- Test role transitions
- Test unauthorized access attempts
- Verify backend validation

---

## Documentation Files

- **Full Guide**: `ROLE_BASED_AUTH_GUIDE.md` - Complete documentation with all patterns
- **Quick Reference**: `ROLE_AUTH_QUICK_REFERENCE.md` - Cheat sheet for common tasks
- **Examples**: `src/examples/RoleBasedUIExample.tsx` - Live demo component

---

## Support & Troubleshooting

### Common Issues

**Q: Role is null/undefined**
- Check that your JWT has a `role` claim
- Verify claim name is exactly `role` (case-sensitive)
- Check console for JWT decode errors

**Q: Role doesn't update after token refresh**
- Ensure you're using `AuthProviderWithRoleSync`
- Check that backend returns updated role in refreshed token
- Verify no errors during token refresh

**Q: Role change events not firing**
- Role only changes when token refreshes, not on every API call
- Ensure role actually changed (old ≠ new)
- Check console logs for "Role changed" messages

### Debug Mode

Add this to see role changes in console:

```tsx
const { userRole, onRoleChange } = useRole();

useEffect(() => {
  console.log('Current role:', userRole);
}, [userRole]);

useEffect(() => {
  return onRoleChange((event) => {
    console.log('ROLE CHANGED:', event);
  });
}, [onRoleChange]);
```

---

## Summary

✅ **Complete role-based authorization system**
✅ **Automatic role extraction from JWT**
✅ **Role change detection on token refresh**
✅ **Easy-to-use hooks and components**
✅ **Comprehensive documentation and examples**
✅ **Production-ready implementation**

You can now build role-based UIs with confidence! 🎉

For questions or issues, refer to:
1. `ROLE_BASED_AUTH_GUIDE.md` - Detailed guide
2. `ROLE_AUTH_QUICK_REFERENCE.md` - Quick reference
3. `src/examples/RoleBasedUIExample.tsx` - Code examples
