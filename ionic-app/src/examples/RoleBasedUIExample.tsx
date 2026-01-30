/**
 * EXAMPLE COMPONENT - Demonstrates Role-Based UI Authorization
 *
 * This file shows all the ways to implement role-based UI in your application.
 * You can copy these patterns into your actual pages/components.
 */

import React, { useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonBadge,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
} from '@ionic/react';
import { shieldCheckmarkOutline, personOutline, alertCircleOutline } from 'ionicons/icons';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../hooks/useRole';
import RoleGuard from '../components/RoleGuard';

/**
 * Example 1: Using useAuth hook directly
 */
const Example1DirectHook: React.FC = () => {
  const { userRole, hasRole } = useAuth();

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>Example 1: Direct useAuth Hook</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <p>Current Role: <IonBadge color="primary">{userRole || 'None'}</IonBadge></p>

        {hasRole('admin') && (
          <IonButton color="danger">Admin Action</IonButton>
        )}

        {hasRole(['admin', 'doctor']) && (
          <IonButton color="warning">Medical Staff Action</IonButton>
        )}

        {!hasRole('admin') && (
          <p>You don't have admin privileges</p>
        )}
      </IonCardContent>
    </IonCard>
  );
};

/**
 * Example 2: Using useRole hook with helpers
 */
const Example2UseRoleHook: React.FC = () => {
  const { userRole, isAdmin, isDoctor, isPatient, hasRole } = useRole();

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>Example 2: useRole Hook with Helpers</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <IonList>
          <IonItem>
            <IonIcon icon={personOutline} slot="start" />
            <IonLabel>Current Role: {userRole}</IonLabel>
          </IonItem>
          <IonItem>
            <IonIcon icon={shieldCheckmarkOutline} slot="start" />
            <IonLabel>Is Admin: {isAdmin ? 'Yes' : 'No'}</IonLabel>
          </IonItem>
          <IonItem>
            <IonIcon icon={shieldCheckmarkOutline} slot="start" />
            <IonLabel>Is Doctor: {isDoctor ? 'Yes' : 'No'}</IonLabel>
          </IonItem>
          <IonItem>
            <IonIcon icon={shieldCheckmarkOutline} slot="start" />
            <IonLabel>Is Patient: {isPatient ? 'Yes' : 'No'}</IonLabel>
          </IonItem>
        </IonList>

        {isAdmin && <p>Welcome, Administrator!</p>}
        {isDoctor && <p>Welcome, Doctor!</p>}
        {isPatient && <p>Welcome, Patient!</p>}
      </IonCardContent>
    </IonCard>
  );
};

/**
 * Example 3: Using RoleGuard component
 */
const Example3RoleGuard: React.FC = () => {
  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>Example 3: RoleGuard Component</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        {/* Simple role guard */}
        <RoleGuard allowedRoles="admin">
          <IonButton expand="block" color="danger">
            <IonIcon icon={shieldCheckmarkOutline} slot="start" />
            Admin Only Button
          </IonButton>
        </RoleGuard>

        {/* Multiple roles with fallback */}
        <RoleGuard
          allowedRoles={['admin', 'doctor']}
          fallback={<p>You need to be admin or doctor to see this</p>}
        >
          <IonButton expand="block" color="warning">
            Medical Staff Dashboard
          </IonButton>
        </RoleGuard>

        {/* Patient-only content */}
        <RoleGuard allowedRoles="patient">
          <IonCard color="light">
            <IonCardHeader>
              <IonCardTitle>Patient Portal</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              Book appointments, view medical history, etc.
            </IonCardContent>
          </IonCard>
        </RoleGuard>
      </IonCardContent>
    </IonCard>
  );
};

/**
 * Example 4: Listening to role changes
 */
const Example4RoleChangeListener: React.FC = () => {
  const { onRoleChange } = useRole();
  const [roleHistory, setRoleHistory] = React.useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = onRoleChange((event) => {
      console.log('Role changed!', event);

      // Add to history
      setRoleHistory(prev => [
        ...prev,
        `${event.oldRole || 'null'} → ${event.newRole || 'null'} at ${event.timestamp.toLocaleTimeString()}`
      ]);

      // You could also:
      // - Show a toast notification
      // - Redirect user to different page
      // - Refresh data based on new role
      // - Update UI permissions
    });

    return unsubscribe;
  }, [onRoleChange]);

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>Example 4: Role Change Listener</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <p>This component listens for role changes (e.g., after token refresh)</p>

        {roleHistory.length > 0 ? (
          <>
            <h3>Role Change History:</h3>
            <IonList>
              {roleHistory.map((change, index) => (
                <IonItem key={index}>
                  <IonIcon icon={alertCircleOutline} slot="start" />
                  <IonLabel>{change}</IonLabel>
                </IonItem>
              ))}
            </IonList>
          </>
        ) : (
          <p>No role changes detected yet. Role changes happen when your token refreshes.</p>
        )}
      </IonCardContent>
    </IonCard>
  );
};

/**
 * Example 5: Conditional rendering for different roles
 */
const Example5ConditionalContent: React.FC = () => {
  const { userRole } = useAuth();

  const renderContentByRole = () => {
    switch (userRole) {
      case 'admin':
        return (
          <IonCard color="danger">
            <IonCardContent>
              <h2>Admin Dashboard</h2>
              <p>Manage users, view analytics, system settings</p>
              <IonButton expand="block">User Management</IonButton>
              <IonButton expand="block">System Settings</IonButton>
              <IonButton expand="block">Analytics</IonButton>
            </IonCardContent>
          </IonCard>
        );

      case 'doctor':
        return (
          <IonCard color="warning">
            <IonCardContent>
              <h2>Doctor Dashboard</h2>
              <p>View appointments, patient records, prescriptions</p>
              <IonButton expand="block">Today's Appointments</IonButton>
              <IonButton expand="block">Patient Records</IonButton>
              <IonButton expand="block">Write Prescription</IonButton>
            </IonCardContent>
          </IonCard>
        );

      case 'patient':
        return (
          <IonCard color="success">
            <IonCardContent>
              <h2>Patient Portal</h2>
              <p>Book appointments, view history, contact doctor</p>
              <IonButton expand="block">Book Appointment</IonButton>
              <IonButton expand="block">My Appointments</IonButton>
              <IonButton expand="block">Medical History</IonButton>
            </IonCardContent>
          </IonCard>
        );

      case 'receptionist':
        return (
          <IonCard color="tertiary">
            <IonCardContent>
              <h2>Receptionist Dashboard</h2>
              <p>Manage appointments, check-in patients</p>
              <IonButton expand="block">Schedule Appointments</IonButton>
              <IonButton expand="block">Patient Check-in</IonButton>
              <IonButton expand="block">View Queue</IonButton>
            </IonCardContent>
          </IonCard>
        );

      default:
        return (
          <IonCard>
            <IonCardContent>
              <p>Unknown role or no role assigned</p>
            </IonCardContent>
          </IonCard>
        );
    }
  };

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>Example 5: Role-Based Content Switching</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        {renderContentByRole()}
      </IonCardContent>
    </IonCard>
  );
};

/**
 * Main Example Page
 */
const RoleBasedUIExample: React.FC = () => {
  const { userRole } = useAuth();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Role-Based UI Examples</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard color="primary">
          <IonCardHeader>
            <IonCardTitle>Your Current Role</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <h1>{userRole || 'No role assigned'}</h1>
            <p>
              This page demonstrates various ways to implement role-based UI authorization.
              The examples below show how different components react to your current role.
            </p>
          </IonCardContent>
        </IonCard>

        <Example1DirectHook />
        <Example2UseRoleHook />
        <Example3RoleGuard />
        <Example4RoleChangeListener />
        <Example5ConditionalContent />

        <IonCard color="light">
          <IonCardHeader>
            <IonCardTitle>Additional Patterns</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <h3>Other use cases:</h3>
            <ul>
              <li>Hide/show menu items based on role</li>
              <li>Enable/disable buttons based on role</li>
              <li>Show different navigation tabs for different roles</li>
              <li>Conditional API calls based on role</li>
              <li>Role-based form fields (show/hide fields)</li>
              <li>Different page layouts per role</li>
            </ul>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default RoleBasedUIExample;
