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
  IonBackButton,
  IonButtons,
} from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { validateUsername, validatePassword, validatePasswordMatch } from '../utils/validation';

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('danger');
  const { register } = useAuth();

  const handleRegister = async () => {
    // Validation
    if (!validateUsername(username)) {
      setToastMessage('Username must be at least 3 characters');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    if (!validatePassword(password)) {
      setToastMessage('Password must be at least 6 characters');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    if (!validatePasswordMatch(password, confirmPassword)) {
      setToastMessage('Passwords do not match');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    setIsLoading(true);
    try {
      await register({ username, password, confirm_password: confirmPassword });
      // Navigation to login is handled by AuthContext
      setToastMessage('Registration successful! Please login.');
      setToastColor('success');
      setShowToast(true);
    } catch (error: any) {
      setToastMessage(error.message || 'Registration failed');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/login" />
          </IonButtons>
          <IonTitle>Register</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ maxWidth: '500px', margin: '0 auto', paddingTop: '2rem' }}>
          <IonCard>
            <IonCardContent>
              <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                <h1 style={{ marginBottom: '0.5rem' }}>Create Account</h1>
                <IonText color="medium">
                  <p>Sign up to get started</p>
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

              <IonItem>
                <IonLabel position="floating">Confirm Password</IonLabel>
                <IonInput
                  type="password"
                  value={confirmPassword}
                  onIonInput={(e) => setConfirmPassword(e.detail.value || '')}
                  disabled={isLoading}
                />
              </IonItem>

              <IonButton
                expand="block"
                onClick={handleRegister}
                disabled={isLoading}
                style={{ marginTop: '1.5rem' }}
              >
                {isLoading ? 'Creating Account...' : 'Register'}
              </IonButton>

              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <IonText color="medium">
                  <p>
                    Already have an account?{' '}
                    <a href="/login" style={{ color: 'var(--ion-color-primary)' }}>
                      Login
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
          color={toastColor}
        />
      </IonContent>
    </IonPage>
  );
};

export default RegisterPage;
