# Role-Based Authorization - Quick Reference

## Import Statements

```typescript
// Hooks
import { useAuth } from '../context/AuthContext';
import { useRole } from '../hooks/useRole';

// Components
import RoleGuard from '../components/RoleGuard';
import RoleProtectedRoute from '../components/RoleProtectedRoute';

// Utilities
import { extractRole, decodeJWT } from '../utils/jwtUtils';
```

---

## Common Patterns

### Check User Role

```typescript
const { userRole, hasRole } = useAuth();

// Single role
if (hasRole('admin')) { }

// Multiple roles (OR)
if (hasRole(['admin', 'doctor'])) { }
```

### Hide/Show UI Elements

```tsx
<RoleGuard allowedRoles="admin">
  <AdminButton />
</RoleGuard>

<RoleGuard allowedRoles={['admin', 'doctor']} fallback={<p>No access</p>}>
  <MedicalContent />
</RoleGuard>
```

### Role-Based Helpers

```typescript
const { isAdmin, isDoctor, isPatient } = useRole();

if (isAdmin) {
  // Admin logic
}
```

### Listen to Role Changes

```typescript
const { onRoleChange } = useRole();

useEffect(() => {
  const unsubscribe = onRoleChange((event) => {
    console.log('Role changed:', event.oldRole, '→', event.newRole);
  });
  return unsubscribe;
}, [onRoleChange]);
```

### Protect Entire Routes

```tsx
<RoleProtectedRoute
  path="/admin"
  allowedRoles="admin"
  component={AdminDashboard}
  redirectTo="/unauthorized"
/>
```

### Conditional Rendering

```tsx
function Dashboard() {
  const { userRole } = useAuth();

  switch (userRole) {
    case 'admin': return <AdminDashboard />;
    case 'doctor': return <DoctorDashboard />;
    case 'patient': return <PatientDashboard />;
    default: return <DefaultDashboard />;
  }
}
```

---

## API Quick Reference

### useAuth()
- `userRole: string | null` - Current role
- `hasRole(role: string | string[]): boolean` - Check role
- `onRoleChange(callback): () => void` - Subscribe to changes
- `refreshRole(): Promise<void>` - Refresh role from token

### useRole()
All of `useAuth()` plus:
- `isAdmin: boolean`
- `isDoctor: boolean`
- `isPatient: boolean`
- `isReceptionist: boolean`
- `roleChangeCount: number`

### RoleGuard Props
- `allowedRoles: string | string[]` - Required
- `children: ReactNode` - Required
- `fallback?: ReactNode` - Optional
- `requireAll?: boolean` - Optional (default: false)

### RoleProtectedRoute Props
- `path: string` - Required
- `allowedRoles: string | string[]` - Required
- `component?: ComponentType` - Optional
- `redirectTo?: string` - Optional

---

## Common Use Cases

### Tab Bar with Role-Based Tabs

```tsx
<IonTabBar>
  <IonTabButton tab="home" href="/home">Home</IonTabButton>

  {isAdmin && (
    <IonTabButton tab="admin" href="/admin">Admin</IonTabButton>
  )}

  {(isDoctor || isAdmin) && (
    <IonTabButton tab="patients" href="/patients">Patients</IonTabButton>
  )}

  {isPatient && (
    <IonTabButton tab="book" href="/book">Book</IonTabButton>
  )}
</IonTabBar>
```

### Menu with Role-Based Items

```tsx
<IonMenu>
  <IonList>
    <RoleGuard allowedRoles="admin">
      <IonItem>User Management</IonItem>
      <IonItem>System Settings</IonItem>
    </RoleGuard>

    <RoleGuard allowedRoles={['admin', 'doctor']}>
      <IonItem>Patient Records</IonItem>
    </RoleGuard>

    <IonItem>Profile</IonItem>
    <IonItem>Logout</IonItem>
  </IonList>
</IonMenu>
```

### Buttons with Role-Based Actions

```tsx
<IonButton onClick={() => handleView()}>View</IonButton>

{hasRole(['admin', 'doctor']) && (
  <IonButton onClick={() => handleEdit()}>Edit</IonButton>
)}

{hasRole('admin') && (
  <IonButton color="danger" onClick={() => handleDelete()}>Delete</IonButton>
)}
```

### Notification on Role Change

```tsx
const [present] = useIonToast();
const { onRoleChange } = useRole();

useEffect(() => {
  return onRoleChange((event) => {
    present({
      message: `Role changed to ${event.newRole}`,
      duration: 3000,
      color: 'primary',
    });
  });
}, [onRoleChange, present]);
```

---

## Role Change Event

```typescript
interface RoleChangeEvent {
  oldRole: string | null;
  newRole: string | null;
  timestamp: Date;
}
```

---

## Tips

✅ Use `useRole()` for cleaner code
✅ Subscribe to role changes for better UX
✅ Always validate roles on backend too
✅ Remember to unsubscribe from listeners
✅ Use constants for role names

❌ Don't rely on frontend checks for security
❌ Don't forget role can be null
❌ Don't hardcode role strings everywhere

---

## Testing Role Changes

Role changes happen when your access token is refreshed (typically after it expires). To test:

1. Wait for token to expire naturally
2. Or reduce token expiration time on backend
3. Or manually call `refreshRole()` after changing role on backend
4. Watch console logs for "Role changed" messages

---

## Example: Complete Implementation

```tsx
import { IonPage, IonContent } from '@ionic/react';
import { useRole } from '../hooks/useRole';
import RoleGuard from '../components/RoleGuard';

function MyPage() {
  const { userRole, isAdmin, onRoleChange } = useRole();

  // Listen for role changes
  useEffect(() => {
    return onRoleChange((event) => {
      console.log('Role updated!', event);
      // Handle change: show notification, redirect, refresh data
    });
  }, [onRoleChange]);

  return (
    <IonPage>
      <IonContent>
        <p>Your role: {userRole}</p>

        {/* Admin only */}
        <RoleGuard allowedRoles="admin">
          <AdminPanel />
        </RoleGuard>

        {/* Doctor or Admin */}
        <RoleGuard allowedRoles={['admin', 'doctor']}>
          <MedicalRecords />
        </RoleGuard>

        {/* Using helper */}
        {isAdmin && <SettingsButton />}
      </IonContent>
    </IonPage>
  );
}
```

---

For detailed documentation, see `ROLE_BASED_AUTH_GUIDE.md`
