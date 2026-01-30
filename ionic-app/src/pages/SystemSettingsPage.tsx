import React, { useState, useEffect } from 'react';
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
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonButtons,
  IonMenuButton,
  IonToast,
  IonSpinner,
  IonText,
  IonNote,
  IonBadge,
} from '@ionic/react';
import {
  keyOutline,
  saveOutline,
  shieldCheckmarkOutline,
  eyeOutline,
  eyeOffOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
} from 'ionicons/icons';
import storageService from '../services/storageService';
import { CLIENT_ID } from '../constants/api';

const SystemSettingsPage: React.FC = () => {
  // State
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning'>('success');

  // Load saved API key on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const savedApiKey = await storageService.getItem(CLIENT_ID);

      if (savedApiKey) {
        setApiKey(savedApiKey);
      }
    } catch (error) {
      console.error('Error loading system settings:', error);
      setToastMessage('Failed to load settings');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    // Validation
    if (!apiKey.trim()) {
      setToastMessage('API Key cannot be empty');
      setToastColor('warning');
      setShowToast(true);
      return;
    }

    if (apiKey.length < 10) {
      setToastMessage('API Key must be at least 10 characters');
      setToastColor('warning');
      setShowToast(true);
      return;
    }

    setIsSaving(true);

    try {
      // Save to storage
      await storageService.setItem(CLIENT_ID, apiKey);

      setToastMessage('System settings saved successfully!');
      setToastColor('success');
      setShowToast(true);
      setHasChanges(false);

      // Here you could also make an API call to save on the backend
      // await apiService.updateSystemSettings({ api_key: apiKey });

    } catch (error) {
      console.error('Error saving system settings:', error);
      setToastMessage('Failed to save settings. Please try again.');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    loadSettings();
    setHasChanges(false);
    setToastMessage('Settings reset');
    setToastColor('warning');
    setShowToast(true);
  };

  const handleClear = async () => {
    try {
      //await storageService.setItem(CLIENT_ID, '');
      setApiKey('');
      setHasChanges(false);
      setToastMessage('API Key cleared');
      setToastColor('success');
      setShowToast(true);
    } catch (error) {
      console.error('Error clearing API key:', error);
      setToastMessage('Failed to clear API Key');
      setToastColor('danger');
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>
            <IonIcon icon={shieldCheckmarkOutline} style={{ marginRight: '8px' }} />
            System Settings
          </IonTitle>
          {/* <IonBadge slot="end" color="danger" style={{ marginRight: '12px' }}>
            Admin Only
          </IonBadge> */}
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Warning Banner */}
        {/* <IonCard color="warning">
          <IonCardContent>
            <IonText>
              <h3>
                <IonIcon icon={alertCircleOutline} style={{ marginRight: '8px' }} />
                Administrator Access Required
              </h3>
              <p style={{ fontSize: '14px', margin: '8px 0 0 0' }}>
                These settings affect the entire system. Changes should only be made by authorized administrators.
              </p>
            </IonText>
          </IonCardContent>
        </IonCard> */}

        {/* Loading State */}
        {isLoading ? (
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <IonSpinner name="crescent" />
            <p>Loading system settings...</p>
          </div>
        ) : (
          <>
            {/* API Key Configuration */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={keyOutline} style={{ marginRight: '8px' }} />
                  API Configuration
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonText color="medium">
                  <p style={{ marginBottom: '16px' }}>
                    Configure the API key used for external service integrations.
                    This key will be used for all API requests.
                  </p>
                </IonText>

                {/* API Key Input */}
                <IonItem lines="full">
                  <IonLabel position="stacked">
                    API Key <IonText color="danger">*</IonText>
                  </IonLabel>
                  <IonInput
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onIonInput={(e) => handleApiKeyChange(e.detail.value!)}
                    placeholder="Enter your API key"
                    required
                  />
                  <IonButton
                    slot="end"
                    fill="clear"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    <IonIcon
                      icon={showApiKey ? eyeOffOutline : eyeOutline}
                      slot="icon-only"
                    />
                  </IonButton>
                </IonItem>

                {/* API Key Info */}
                {apiKey && (
                  <div style={{ marginTop: '12px', marginLeft: '16px' }}>
                    <IonText color={apiKey.length >= 10 ? 'success' : 'danger'}>
                      <p style={{ fontSize: '12px', margin: 0 }}>
                        <IonIcon
                          icon={apiKey.length >= 10 ? checkmarkCircleOutline : alertCircleOutline}
                        />
                        {' '}Length: {apiKey.length} characters
                        {apiKey.length < 10 && ' (minimum 10 required)'}
                      </p>
                    </IonText>
                  </div>
                )}

                <IonNote>
                  <p style={{ fontSize: '12px', marginTop: '12px', marginLeft: '16px' }}>
                    Keep your API key secure. Never share it publicly or commit it to version control.
                  </p>
                </IonNote>

                {/* Action Buttons */}
                <div style={{ marginTop: '24px', display: 'flex', gap: '8px', flexDirection: 'column' }}>
                  <IonButton
                    expand="block"
                    onClick={handleSave}
                    disabled={isSaving || !hasChanges}
                    color="primary"
                  >
                    {isSaving ? (
                      <>
                        <IonSpinner name="crescent" style={{ marginRight: '8px' }} />
                        Saving...
                      </>
                    ) : (
                      <>
                        <IonIcon icon={saveOutline} slot="start" />
                        Save API Key
                      </>
                    )}
                  </IonButton>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <IonButton
                      expand="block"
                      fill="outline"
                      onClick={handleReset}
                      disabled={isSaving || !hasChanges}
                    >
                      Reset
                    </IonButton>
                    <IonButton
                      expand="block"
                      fill="outline"
                      color="danger"
                      onClick={handleClear}
                      disabled={isSaving}
                    >
                      Clear
                    </IonButton>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>

            {/* Current Status */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Current Status</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonItem lines="none">
                  <IonLabel>
                    <h3>API Key Status</h3>
                    <p>
                      {apiKey ? (
                        <IonBadge color="success">
                          <IonIcon icon={checkmarkCircleOutline} style={{ marginRight: '4px' }} />
                          Configured
                        </IonBadge>
                      ) : (
                        <IonBadge color="danger">
                          <IonIcon icon={alertCircleOutline} style={{ marginRight: '4px' }} />
                          Not Configured
                        </IonBadge>
                      )}
                    </p>
                  </IonLabel>
                </IonItem>
                <IonItem lines="none">
                  <IonLabel>
                    <h3>Unsaved Changes</h3>
                    <p>
                      {hasChanges ? (
                        <IonBadge color="warning">
                          <IonIcon icon={alertCircleOutline} style={{ marginRight: '4px' }} />
                          Yes
                        </IonBadge>
                      ) : (
                        <IonBadge color="medium">
                          No
                        </IonBadge>
                      )}
                    </p>
                  </IonLabel>
                </IonItem>
              </IonCardContent>
            </IonCard>

            {/* Help Card */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Help & Documentation</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonText color="medium">
                  <h3 style={{ fontSize: '14px', marginTop: 0 }}>How to obtain an API Key:</h3>
                  <ol style={{ fontSize: '13px', paddingLeft: '20px' }}>
                    <li>Log in to your service provider's dashboard</li>
                    <li>Navigate to API settings or developer section</li>
                    <li>Generate a new API key</li>
                    <li>Copy the key and paste it here</li>
                    <li>Click "Save API Key" to apply changes</li>
                  </ol>

                  <h3 style={{ fontSize: '14px', marginTop: '16px' }}>Security Best Practices:</h3>
                  <ul style={{ fontSize: '13px', paddingLeft: '20px' }}>
                    <li>Keep your API key confidential</li>
                    <li>Rotate keys regularly (every 90 days recommended)</li>
                    <li>Never share keys via email or messaging</li>
                    <li>Use environment-specific keys</li>
                    <li>Monitor API usage for unusual activity</li>
                  </ul>
                </IonText>
              </IonCardContent>
            </IonCard>
          </>
        )}

        {/* Toast Notification */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastColor}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default SystemSettingsPage;
