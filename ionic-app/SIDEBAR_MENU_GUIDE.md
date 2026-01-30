# Sidebar Menu Guide

## Overview

A role-based sidebar menu has been added to your Ionic application with the following features:

✅ **Role-based menu items** - Different items visible to different roles
✅ **Admin-only "Register New User"** link - Only admins can see and access user registration
✅ **User information display** - Shows current user ID and role
✅ **Quick navigation** - Access all pages from one place
✅ **Integrated with existing auth** - Works seamlessly with your authentication system

---

## Menu Structure

### 🔓 Available to All Users

**User Information:**
- User ID display
- Current role badge

**Navigation:**
- Home
- Book Appointment
- My Appointments / Appointments
- Voice Assistant

**Account:**
- Profile
- Settings
- Logout

---

### 👨‍⚕️ Doctor & Admin Only

**Medical Staff Section:**
- Patient List
- My Schedule

---

### 🛡️ Admin Only

**Administration Section:**
- **Register New User** ⚠️ (Admin only - highlighted in warning color)
- Manage Users
- Analytics
- System Settings

---

### 👔 Receptionist & Admin Only

**Reception Section:**
- Manage Appointments
- Check-in Patients

---

## How to Access the Menu

The menu can be opened by:

1. **Clicking the menu button** (☰) in the top-left corner of any page
2. **Swiping from the left edge** of the screen (on mobile/tablet)
3. **Keyboard shortcut** (if configured in your Ionic app)

---

## Admin Registration Feature

### How it Works

Only users with the `admin` role can:
- See the "Register New User" menu item
- Access the registration page via the menu
- The menu item is highlighted with a warning color and "Admin" badge

### Visual Appearance

```
📋 Administration
   👤 Register New User ⚠️ [Admin]
   👥 Manage Users
   📊 Analytics
   ⚙️ System Settings
```

The "Register New User" item has:
- Warning color (orange/yellow)
- Bold text
- "Admin" badge on the right
- Person icon with a plus sign

---

## Implementation Details

### Files Modified/Created

1. **Created:**
   - `src/components/SidebarMenu.tsx` - The sidebar menu component

2. **Modified:**
   - `src/App.tsx` - Added sidebar menu to the app
   - `src/pages/BookAppointmentPage.tsx` - Added menu button
   - `src/pages/MyAppointmentsPage.tsx` - Added menu button
   - `src/pages/VoiceAssistantPage.tsx` - Added menu button

---

## Code Examples

### How the Admin-Only Menu Item Works

```tsx
<RoleGuard allowedRoles="admin">
  <IonList>
    <IonListHeader>
      <IonLabel>Administration</IonLabel>
    </IonListHeader>

    {/* Register New User - Admin Only */}
    <IonMenuToggle>
      <IonItem button onClick={() => history.push('/register')}>
        <IonIcon icon={personAddOutline} slot="start" color="warning" />
        <IonLabel color="warning">
          <strong>Register New User</strong>
        </IonLabel>
        <IonBadge color="warning" slot="end">Admin</IonBadge>
      </IonItem>
    </IonMenuToggle>

    {/* Other admin items... */}
  </IonList>
</RoleGuard>
```

### How to Add More Menu Items

To add a new menu item:

```tsx
// For all users (inside main navigation list)
<IonMenuToggle>
  <IonItem button onClick={() => history.push('/your-page')}>
    <IonIcon icon={yourIcon} slot="start" />
    <IonLabel>Your Page</IonLabel>
  </IonItem>
</IonMenuToggle>

// For specific roles only
<RoleGuard allowedRoles="doctor">
  <IonMenuToggle>
    <IonItem button onClick={() => history.push('/doctor-only-page')}>
      <IonIcon icon={yourIcon} slot="start" />
      <IonLabel>Doctor Only Page</IonLabel>
    </IonItem>
  </IonMenuToggle>
</RoleGuard>

// For multiple roles
<RoleGuard allowedRoles={['admin', 'doctor']}>
  <IonMenuToggle>
    <IonItem button onClick={() => history.push('/medical-staff-page')}>
      <IonIcon icon={yourIcon} slot="start" />
      <IonLabel>Medical Staff Page</IonLabel>
    </IonItem>
  </IonMenuToggle>
</RoleGuard>
```

---

## Menu Behavior

### Opening the Menu
- Click the menu button (☰) in the header
- Swipe from left edge (mobile)

### Closing the Menu
- Click any menu item (auto-closes with IonMenuToggle)
- Click outside the menu
- Swipe back to the left
- Click the backdrop

### Navigation
- All menu items use `IonMenuToggle` to automatically close the menu after selection
- Uses React Router's `history.push()` for navigation
- Maintains app state during navigation

---

## Customization

### Change Menu Colors

Edit `src/components/SidebarMenu.tsx`:

```tsx
// Header color
<IonToolbar color="primary"> // Change to "secondary", "tertiary", etc.

// Admin items color
<IonLabel color="warning"> // Change to "danger", "success", etc.
```

### Add Menu Item Icons

Import icons from `ionicons`:

```tsx
import { yourIconOutline } from 'ionicons/icons';

<IonIcon icon={yourIconOutline} slot="start" />
```

Browse icons at: https://ionic.io/ionicons

### Change Menu Type

In `src/components/SidebarMenu.tsx`:

```tsx
<IonMenu contentId="main-content" type="overlay">
```

Change `type` to:
- `"overlay"` - Menu overlays content (default)
- `"reveal"` - Content slides to reveal menu
- `"push"` - Content pushes to the side

---

## Role-Based Menu Summary

| Role | Visible Sections |
|------|------------------|
| **Patient** | User Info, Navigation, Account |
| **Doctor** | User Info, Navigation, Medical Staff, Account |
| **Receptionist** | User Info, Navigation, Reception, Account |
| **Admin** | User Info, Navigation, Medical Staff, Administration, Reception, Account |

---

## Testing the Menu

### Test as Different Roles

1. **Login as admin:**
   - Should see all sections including "Administration"
   - "Register New User" should be visible and highlighted
   - Can access `/register` via menu

2. **Login as doctor:**
   - Should see "Medical Staff" section
   - Should NOT see "Administration" section
   - Cannot see "Register New User" link

3. **Login as patient:**
   - Should see basic navigation only
   - No "Medical Staff" or "Administration" sections

4. **Login as receptionist:**
   - Should see "Reception" section
   - Should NOT see "Administration" section

### Verify Role Change Detection

1. Login as one role
2. Change role on backend
3. Wait for token refresh (or trigger manually)
4. Open menu - should see updated menu items based on new role

---

## Security Notes

⚠️ **Important:** The menu only HIDES items based on role. You must also:

1. **Protect routes** - Use `RoleProtectedRoute` or `ProtectedRoute`
2. **Validate on backend** - Always check permissions on the server
3. **Handle unauthorized access** - Redirect users who manually navigate to protected routes

### Example Route Protection

```tsx
// In App.tsx
<RoleProtectedRoute
  path="/register"
  allowedRoles="admin"
  component={RegisterPage}
  redirectTo="/unauthorized"
/>
```

---

## Troubleshooting

### Menu Button Not Visible
- Check that `IonMenuButton` is added to the page header
- Verify `IonButtons` with `slot="start"` is used
- Check browser console for errors

### Menu Items Not Showing
- Verify user has correct role
- Check console for role value: `console.log(userRole)`
- Ensure `RoleGuard` is wrapping the items correctly

### Menu Not Opening
- Verify `contentId="main-content"` matches between menu and content
- Check that `IonMenu` is inside `IonReactRouter`
- Ensure app is wrapped with `AuthProviderWithRoleSync`

### Register Link Not Working
- Verify route exists in `App.tsx`
- Check that user has `admin` role
- Verify backend returns `role: "admin"` in JWT token

---

## Next Steps

1. **Customize menu items** - Add/remove items based on your needs
2. **Add more role-specific pages** - Create pages for different roles
3. **Protect routes** - Use `RoleProtectedRoute` for admin-only pages
4. **Style the menu** - Customize colors, icons, and layout
5. **Add badges/notifications** - Show unread counts or alerts in menu

---

## Support

For more information:
- **Role-based UI**: See `ROLE_BASED_AUTH_GUIDE.md`
- **Quick reference**: See `ROLE_AUTH_QUICK_REFERENCE.md`
- **Examples**: See `src/examples/RoleBasedUIExample.tsx`

The sidebar menu is fully integrated with your role-based authorization system! 🎉
