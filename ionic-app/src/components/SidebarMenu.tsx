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
  keyOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../hooks/useRole';
import RoleGuard from './RoleGuard';

const SidebarMenu: React.FC = () => {
  const history = useHistory();
  const { logout, userRole, username } = useAuth();
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
              <h3>{username || 'None'}</h3>
            </IonLabel>
          </IonItem>
        </IonList>

        {/* Main Navigation */}
        <IonList>
          <IonListHeader>
            <IonLabel>Navigation</IonLabel>
          </IonListHeader>

          {/* Voice Assistant */}
          <IonMenuToggle>
            <IonItem button onClick={() => history.push('/assistant')}>
              <IonIcon icon={micOutline} slot="start" />
              <IonLabel>Voice Assistant</IonLabel>
            </IonItem>
          </IonMenuToggle>
        </IonList>



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
              </IonItem>
            </IonMenuToggle>

            <IonMenuToggle>
              <IonItem button onClick={() => history.push('/manage-users')}>
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
              <IonItem button onClick={() => history.push('/system-settings')}>
                <IonIcon icon={settingsOutline} slot="start" />
                <IonLabel>System Settings</IonLabel>
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
            <IonItem button onClick={() => history.push('/update-password')}>
              <IonIcon icon={keyOutline} slot="start" />
              <IonLabel>Change Password</IonLabel>
            </IonItem>
          </IonMenuToggle>

          <IonMenuToggle>
            <IonItem button onClick={() => history.push('/settings')}>
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
            <small>Data Management System</small>
          </IonNote>
        </div>
      </IonContent>
    </IonMenu>
  );
};

export default SidebarMenu;
