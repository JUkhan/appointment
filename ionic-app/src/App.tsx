import React, { useEffect, useState } from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonRouterOutlet,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonSpinner,
  setupIonicReact,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { calendarOutline, listOutline, micOutline } from 'ionicons/icons';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Ionic Dark Mode */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

/* Context */
import { AuthProviderWithRoleSync } from './components/AuthProviderWithRoleSync';

/* Components */
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import SidebarMenu from './components/SidebarMenu';

/* Pages */
import CreateClientPage from './pages/CreateClientPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VoiceAssistantPage from './pages/VoiceAssistantPage';
import ManageUsersPage from './pages/ManageUsersPage';
import UpdatePasswordPage from './pages/UpdatePasswordPage';
import SettingsPage from './pages/SettingsPage';
import SystemSettingsPage from './pages/SystemSettingsPage';

/* Services & Constants */
import storageService from './services/storageService';
import { CLIENT_ID } from './constants/api';

setupIonicReact();

const App: React.FC = () => {
  const [hasClientId, setHasClientId] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if CLIENT_ID exists in storage
    const checkClientId = async () => {
      try {
        const clientId = await storageService.getItem(CLIENT_ID);
        setHasClientId(!!clientId);
      } catch (error) {
        console.error('Error checking CLIENT_ID:', error);
        setHasClientId(false);
      }
    };

    checkClientId();
  }, []);

  // Show loading spinner while checking CLIENT_ID
  if (hasClientId === null) {
    return (
      <IonApp>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}>
          <IonSpinner name="crescent" />
        </div>
      </IonApp>
    );
  }

  // If no CLIENT_ID, show CreateClientPage
  if (!hasClientId) {
    return (
      <IonApp>
        <IonReactRouter>
          <IonRouterOutlet>
            <Route exact path="/system-settings">
              <SystemSettingsPage />
            </Route>
            <Route exact path="/">
              <CreateClientPage />
            </Route>
          </IonRouterOutlet>
        </IonReactRouter>
      </IonApp>
    );
  }

  // If CLIENT_ID exists, show normal flow
  return (
    <IonApp>
      <IonReactRouter>

        <AuthProviderWithRoleSync>
          {/* Sidebar Menu */}
          <SidebarMenu />

          <IonRouterOutlet id="main-content">
            {/* Public Routes */}
            <Route exact path="/login">
              <LoginPage />
            </Route>
            <RoleProtectedRoute allowedRoles={'admin'} exact path="/register">
              <RegisterPage />
            </RoleProtectedRoute>

            <RoleProtectedRoute allowedRoles={'admin'} exact path="/manage-users">
              <ManageUsersPage />
            </RoleProtectedRoute>

            <Route exact path="/system-settings">
              <SystemSettingsPage />
            </Route>

            {/* Protected Routes (All Authenticated Users) */}
            <ProtectedRoute
              exact
              path="/update-password"
              component={UpdatePasswordPage}
            />
            <ProtectedRoute
              exact
              path="/settings"
              component={SettingsPage}
            />
            <ProtectedRoute
              exact
              path="/assistant"
              component={VoiceAssistantPage}
            />


            {/* Default Redirect */}
            <Route exact path="/">
              <Redirect to="/login" />
            </Route>
          </IonRouterOutlet>
        </AuthProviderWithRoleSync>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
