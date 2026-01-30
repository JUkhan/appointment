import React from 'react';
import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonMenuToggle,
  IonListHeader,
  IonNote,
  IonBadge,
  IonButton,
} from '@ionic/react';
import {
  personAddOutline,
  calendarOutline,
  listOutline,
  micOutline,
  logOutOutline,
  personOutline,
  homeOutline,
  peopleOutline,
  settingsOutline,
  statsChartOutline,
  medkitOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../hooks/useRole';
import RoleGuard from './RoleGuard';

const SidebarMenu: React.FC = () => {
  const history = useHistory();
  const { logout, userId, userRole } = useAuth();
  const { isAdmin, isDoctor, isPatient, isReceptionist } = useRole();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <IonMenu contentId="main-content" type="overlay">
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Menu</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* User Info Section */}
        <IonList>
          <IonListHeader>
            <IonLabel>User Information</IonLabel>
          </IonListHeader>
          <IonItem lines="none">
            <IonIcon icon={personOutline} slot="start" />
            <IonLabel>
              <h3>User ID: {userId}</h3>
              <p>
                Role: <IonBadge color="primary">{userRole || 'None'}</IonBadge>
              </p>
            </IonLabel>
          </IonItem>
        </IonList>

        {/* Main Navigation */}
        <IonList>
          <IonListHeader>
            <IonLabel>Navigation</IonLabel>
          </IonListHeader>

          {/* Home / Dashboard */}
          <IonMenuToggle>
            <IonItem button onClick={() => history.push('/tabs/book')}>
              <IonIcon icon={homeOutline} slot="start" />
              <IonLabel>Home</IonLabel>
            </IonItem>
          </IonMenuToggle>

          {/* Book Appointment */}
          <IonMenuToggle>
            <IonItem button onClick={() => history.push('/tabs/book')}>
              <IonIcon icon={calendarOutline} slot="start" />
              <IonLabel>Book Appointment</IonLabel>
            </IonItem>
          </IonMenuToggle>

          {/* My Appointments */}
          <IonMenuToggle>
            <IonItem button onClick={() => history.push('/tabs/appointments')}>
              <IonIcon icon={listOutline} slot="start" />
              <IonLabel>
                {isPatient ? 'My Appointments' : 'Appointments'}
              </IonLabel>
            </IonItem>
          </IonMenuToggle>

          {/* Voice Assistant */}
          <IonMenuToggle>
            <IonItem button onClick={() => history.push('/tabs/assistant')}>
              <IonIcon icon={micOutline} slot="start" />
              <IonLabel>Voice Assistant</IonLabel>
            </IonItem>
          </IonMenuToggle>
        </IonList>

        {/* Doctor Section */}
        <RoleGuard allowedRoles={['doctor', 'admin']}>
          <IonList>
            <IonListHeader>
              <IonLabel>Medical Staff</IonLabel>
            </IonListHeader>

            <IonMenuToggle>
              <IonItem button>
                <IonIcon icon={peopleOutline} slot="start" />
                <IonLabel>Patient List</IonLabel>
              </IonItem>
            </IonMenuToggle>

            <IonMenuToggle>
              <IonItem button>
                <IonIcon icon={medkitOutline} slot="start" />
                <IonLabel>My Schedule</IonLabel>
              </IonItem>
            </IonMenuToggle>
          </IonList>
        </RoleGuard>

        {/* Admin Section */}
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

            <IonMenuToggle>
              <IonItem button>
                <IonIcon icon={peopleOutline} slot="start" />
                <IonLabel>Manage Users</IonLabel>
              </IonItem>
            </IonMenuToggle>

            <IonMenuToggle>
              <IonItem button>
                <IonIcon icon={statsChartOutline} slot="start" />
                <IonLabel>Analytics</IonLabel>
              </IonItem>
            </IonMenuToggle>

            <IonMenuToggle>
              <IonItem button>
                <IonIcon icon={settingsOutline} slot="start" />
                <IonLabel>System Settings</IonLabel>
              </IonItem>
            </IonMenuToggle>
          </IonList>
        </RoleGuard>

        {/* Receptionist Section */}
        <RoleGuard allowedRoles={['receptionist', 'admin']}>
          <IonList>
            <IonListHeader>
              <IonLabel>Reception</IonLabel>
            </IonListHeader>

            <IonMenuToggle>
              <IonItem button>
                <IonIcon icon={calendarOutline} slot="start" />
                <IonLabel>Manage Appointments</IonLabel>
              </IonItem>
            </IonMenuToggle>

            <IonMenuToggle>
              <IonItem button>
                <IonIcon icon={peopleOutline} slot="start" />
                <IonLabel>Check-in Patients</IonLabel>
              </IonItem>
            </IonMenuToggle>
          </IonList>
        </RoleGuard>

        {/* Account Section */}
        <IonList>
          <IonListHeader>
            <IonLabel>Account</IonLabel>
          </IonListHeader>

          <IonMenuToggle>
            <IonItem button>
              <IonIcon icon={personOutline} slot="start" />
              <IonLabel>Profile</IonLabel>
            </IonItem>
          </IonMenuToggle>

          <IonMenuToggle>
            <IonItem button>
              <IonIcon icon={settingsOutline} slot="start" />
              <IonLabel>Settings</IonLabel>
            </IonItem>
          </IonMenuToggle>
        </IonList>

        {/* Logout */}
        <IonList>
          <IonMenuToggle>
            <IonItem button onClick={handleLogout} lines="none">
              <IonIcon icon={logOutOutline} slot="start" color="danger" />
              <IonLabel color="danger">Logout</IonLabel>
            </IonItem>
          </IonMenuToggle>
        </IonList>

        {/* Footer Note */}
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <IonNote>
            <small>Appointment Management System</small>
          </IonNote>
        </div>
      </IonContent>
    </IonMenu>
  );
};

export default SidebarMenu;
