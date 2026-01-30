import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonCard,
  IonCardContent,
  IonItem,
  IonInput,
  IonButton,
  IonToast,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonText
} from '@ionic/react';

import apiService from '../services/apiService';
import storageService from '../services/storageService';
import { CLIENT_ID } from '../constants/api';
import { useHistory } from 'react-router-dom';

const CreateClientPage: React.FC = () => {
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
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
        mobile
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

  const moveToApiKeySetup = () => {
    history.push('/system-settings');
  }


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
                <IonInput
                  type="text"
                  placeholder="Enter Business Name *"
                  label="Business Name"
                  labelPlacement="floating"
                  value={businessName}
                  onIonInput={(e) => setBusinessName(e.detail.value || '')}
                  disabled={isLoading}
                />
              </IonItem>

              <IonItem>
                <IonInput
                  type="text"
                  placeholder="Enter Address *"
                  label="Address"
                  labelPlacement="floating"
                  value={address}
                  onIonInput={(e) => setAddress(e.detail.value || '')}
                  disabled={isLoading}
                />
              </IonItem>

              <IonItem>
                <IonInput
                  type="email"
                  labelPlacement="floating"
                  placeholder="Enter Email *"
                  label="Email"
                  value={email}
                  onIonInput={(e) => setEmail(e.detail.value || '')}
                  disabled={isLoading}
                />
              </IonItem>

              <IonItem>
                <IonInput
                  type="tel"
                  labelPlacement="floating"
                  placeholder="Enter Mobile Number *"
                  label="Mobile Number"
                  value={mobile}
                  onIonInput={(e) => setMobile(e.detail.value || '')}
                  disabled={isLoading}
                  maxlength={15}
                />
              </IonItem>



              <IonButton
                expand="block"
                onClick={handleCreateClient}
                disabled={isLoading}
                style={{ marginTop: '1.5rem' }}
              >
                {isLoading ? 'Creating...' : 'Create Organization'}
              </IonButton>

              <IonButton
                expand="block"
                onClick={moveToApiKeySetup}
                style={{ marginTop: '1.5rem' }}
              >
                Setup API Key
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
