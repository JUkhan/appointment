import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonRouterOutlet,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
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
import { AuthProvider } from './context/AuthContext';

/* Components */
import ProtectedRoute from './components/ProtectedRoute';

/* Pages */
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BookAppointmentPage from './pages/BookAppointmentPage';
import MyAppointmentsPage from './pages/MyAppointmentsPage';
import VoiceAssistantPage from './pages/VoiceAssistantPage';

setupIonicReact();

const App: React.FC = () => {
  return (
    <IonApp>
      <IonReactRouter>
        <AuthProvider>
          <IonRouterOutlet>
            {/* Public Routes */}
            <Route exact path="/login">
              <LoginPage />
            </Route>
            <Route exact path="/register">
              <RegisterPage />
            </Route>

            {/* Protected Routes with Tabs */}
            <Route path="/tabs">
              <IonTabs>
                <IonRouterOutlet>
                  <ProtectedRoute exact path="/tabs/book" component={BookAppointmentPage} />
                  <ProtectedRoute
                    exact
                    path="/tabs/appointments"
                    component={MyAppointmentsPage}
                  />
                  <ProtectedRoute
                    exact
                    path="/tabs/assistant"
                    component={VoiceAssistantPage}
                  />
                  <Route exact path="/tabs">
                    <Redirect to="/tabs/book" />
                  </Route>
                </IonRouterOutlet>

                <IonTabBar slot="bottom">
                  <IonTabButton tab="book" href="/tabs/book">
                    <IonIcon icon={calendarOutline} />
                    <IonLabel>Book</IonLabel>
                  </IonTabButton>
                  <IonTabButton tab="appointments" href="/tabs/appointments">
                    <IonIcon icon={listOutline} />
                    <IonLabel>Appointments</IonLabel>
                  </IonTabButton>
                  <IonTabButton tab="assistant" href="/tabs/assistant">
                    <IonIcon icon={micOutline} />
                    <IonLabel>Assistant</IonLabel>
                  </IonTabButton>
                </IonTabBar>
              </IonTabs>
            </Route>

            {/* Default Redirect */}
            <Route exact path="/">
              <Redirect to="/login" />
            </Route>
          </IonRouterOutlet>
        </AuthProvider>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
