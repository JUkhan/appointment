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
  IonToggle,
  IonSelect,
  IonSelectOption,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import apiService from '../services/apiService';
import storageService from '../services/storageService';
import { CLIENT_ID } from '../constants/api';

const CreateClientPage: React.FC = () => {
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [modules, setModules] = useState('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('danger');
  const history = useHistory();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateMobile = (mobile: string): boolean => {
    const mobileRegex = /^[0-9]{10,15}$/;
    return mobileRegex.test(mobile);
  };

  const handleCreateClient = async () => {
    // Validation
    if (!businessName.trim()) {
      setToastMessage('Business name is required');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    if (businessName.trim().length < 3) {
      setToastMessage('Business name must be at least 3 characters');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    if (!address.trim()) {
      setToastMessage('Address is required');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    if (!email.trim()) {
      setToastMessage('Email is required');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    if (!validateEmail(email)) {
      setToastMessage('Please enter a valid email address');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    if (!mobile.trim()) {
      setToastMessage('Mobile number is required');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    if (!validateMobile(mobile)) {
      setToastMessage('Please enter a valid mobile number (10-15 digits)');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.createClient({
        business_name: businessName,
        address,
        email,
        mobile,
        is_active: isActive,
        modules,
      });

      // Store client ID
      await storageService.setItem(CLIENT_ID, response.client.id);

      setToastMessage('Client created successfully!');
      setToastColor('success');
      setShowToast(true);

      // Navigate to login after short delay with full page reload
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (error: any) {
      setToastMessage(error.response?.data?.error || 'Failed to create client');
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
          <IonTitle>Setup Your Organization</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '2rem' }}>
          <IonCard>
            <IonCardContent>
              <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                <h1 style={{ marginBottom: '0.5rem' }}>Welcome!</h1>
                <IonText color="medium">
                  <p>Please register your organization to get started</p>
                  <p style={{ fontSize: '0.875rem' }}>
                    * All fields are required
                  </p>
                </IonText>
              </div>

              <IonItem>
                <IonLabel position="floating">Business Name *</IonLabel>
                <IonInput
                  type="text"
                  value={businessName}
                  onIonInput={(e) => setBusinessName(e.detail.value || '')}
                  disabled={isLoading}
                  placeholder="Enter your business name"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="floating">Address *</IonLabel>
                <IonInput
                  type="text"
                  value={address}
                  onIonInput={(e) => setAddress(e.detail.value || '')}
                  disabled={isLoading}
                  placeholder="Enter your business address"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="floating">Email *</IonLabel>
                <IonInput
                  type="email"
                  value={email}
                  onIonInput={(e) => setEmail(e.detail.value || '')}
                  disabled={isLoading}
                  placeholder="contact@example.com"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="floating">Mobile Number *</IonLabel>
                <IonInput
                  type="tel"
                  value={mobile}
                  onIonInput={(e) => setMobile(e.detail.value || '')}
                  disabled={isLoading}
                  placeholder="1234567890"
                  maxlength={15}
                />
              </IonItem>

              <IonItem>
                <IonLabel>Active Status</IonLabel>
                <IonToggle
                  checked={isActive}
                  onIonChange={(e) => setIsActive(e.detail.checked)}
                  disabled={isLoading}
                />
              </IonItem>

              <IonItem>
                <IonLabel>Modules</IonLabel>
                <IonSelect
                  value={modules}
                  onIonChange={(e) => setModules(e.detail.value)}
                  disabled={isLoading}
                >
                  <IonSelectOption value="basic">Basic</IonSelectOption>
                  <IonSelectOption value="premium">Premium</IonSelectOption>
                  <IonSelectOption value="enterprise">Enterprise</IonSelectOption>
                </IonSelect>
              </IonItem>

              <IonButton
                expand="block"
                onClick={handleCreateClient}
                disabled={isLoading}
                style={{ marginTop: '1.5rem' }}
              >
                {isLoading ? 'Creating...' : 'Create Organization'}
              </IonButton>

              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <IonText color="medium">
                  <p style={{ fontSize: '0.875rem' }}>
                    After creating your organization, you can set up user accounts
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

export default CreateClientPage;
