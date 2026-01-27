import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonToast,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonText,
} from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { validateUsername, validatePassword } from '../utils/validation';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const { login } = useAuth();

  const handleLogin = async () => {
    // Validation
    if (!validateUsername(username)) {
      setToastMessage('Username must be at least 3 characters');
      setShowToast(true);
      return;
    }

    if (!validatePassword(password)) {
      setToastMessage('Password must be at least 6 characters');
      setShowToast(true);
      return;
    }

    setIsLoading(true);
    try {
      await login({ username, password });
      // Navigation is handled by AuthContext
    } catch (error: any) {
      setToastMessage(error.message || 'Login failed');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Login</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ maxWidth: '500px', margin: '0 auto', paddingTop: '2rem' }}>
          <IonCard>
            <IonCardContent>
              <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                <h1 style={{ marginBottom: '0.5rem' }}>Doctor Appointment</h1>
                <IonText color="medium">
                  <p>Sign in to book your appointment</p>
                </IonText>
              </div>

              <IonItem>
                <IonLabel position="floating">Username</IonLabel>
                <IonInput
                  type="text"
                  value={username}
                  onIonInput={(e) => setUsername(e.detail.value || '')}
                  disabled={isLoading}
                />
              </IonItem>

              <IonItem>
                <IonLabel position="floating">Password</IonLabel>
                <IonInput
                  type="password"
                  value={password}
                  onIonInput={(e) => setPassword(e.detail.value || '')}
                  disabled={isLoading}
                />
              </IonItem>

              <IonButton
                expand="block"
                onClick={handleLogin}
                disabled={isLoading}
                style={{ marginTop: '1.5rem' }}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </IonButton>

              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <IonText color="medium">
                  <p>
                    Don't have an account?{' '}
                    <a href="/register" style={{ color: 'var(--ion-color-primary)' }}>
                      Register
                    </a>
                  </p>
                </IonText>
              </div>
            </IonCardContent>
          </IonCard>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color="danger"
        />
      </IonContent>
    </IonPage>
  );
};

export default LoginPage;
