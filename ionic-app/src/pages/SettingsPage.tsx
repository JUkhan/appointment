import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonIcon,
  IonButtons,
  IonMenuButton,
  IonListHeader,
  IonNote,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonBadge,
  IonSelect,
  IonSelectOption,
  IonToast,
} from '@ionic/react';
import {
  moonOutline,
  notificationsOutline,
  languageOutline,
  keyOutline,
  personOutline,
  informationCircleOutline,
  shieldCheckmarkOutline,
  documentTextOutline,
  helpCircleOutline,
  mailOutline,
  phonePortraitOutline,
  globeOutline,
  colorPaletteOutline,
  timeOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../hooks/useRole';
import storageService from '../services/storageService';

const SettingsPage: React.FC = () => {
  const history = useHistory();
  const { userId, userRole } = useAuth();
  const { isAdmin } = useRole();

  // Settings state
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [language, setLanguage] = useState('en');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [timeFormat, setTimeFormat] = useState('12h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load saved settings from storage
      const savedDarkMode = await storageService.getItem('settings_darkMode');
      const savedNotifications = await storageService.getItem('settings_notifications');
      const savedEmailNotifications = await storageService.getItem('settings_emailNotifications');
      const savedSmsNotifications = await storageService.getItem('settings_smsNotifications');
      const savedLanguage = await storageService.getItem('settings_language');
      const savedDateFormat = await storageService.getItem('settings_dateFormat');
      const savedTimeFormat = await storageService.getItem('settings_timeFormat');
      const savedAutoRefresh = await storageService.getItem('settings_autoRefresh');

      if (savedDarkMode !== null) setDarkMode(savedDarkMode === 'true');
      if (savedNotifications !== null) setNotifications(savedNotifications === 'true');
      if (savedEmailNotifications !== null) setEmailNotifications(savedEmailNotifications === 'true');
      if (savedSmsNotifications !== null) setSmsNotifications(savedSmsNotifications === 'true');
      if (savedLanguage) setLanguage(savedLanguage);
      if (savedDateFormat) setDateFormat(savedDateFormat);
      if (savedTimeFormat) setTimeFormat(savedTimeFormat);
      if (savedAutoRefresh !== null) setAutoRefresh(savedAutoRefresh === 'true');

      // Apply dark mode
      if (savedDarkMode === 'true') {
        document.body.classList.add('dark');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSetting = async (key: string, value: string) => {
    try {
      await storageService.setItem(key, value);
      setToastMessage('Settings saved');
      setShowToast(true);
    } catch (error) {
      console.error('Error saving setting:', error);
      setToastMessage('Failed to save settings');
      setShowToast(true);
    }
  };

  const handleDarkModeToggle = async (checked: boolean) => {
    setDarkMode(checked);
    await saveSetting('settings_darkMode', checked.toString());

    // Apply dark mode to body
    if (checked) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  };

  const handleNotificationsToggle = async (checked: boolean) => {
    setNotifications(checked);
    await saveSetting('settings_notifications', checked.toString());
  };

  const handleEmailNotificationsToggle = async (checked: boolean) => {
    setEmailNotifications(checked);
    await saveSetting('settings_emailNotifications', checked.toString());
  };

  const handleSmsNotificationsToggle = async (checked: boolean) => {
    setSmsNotifications(checked);
    await saveSetting('settings_smsNotifications', checked.toString());
  };

  const handleLanguageChange = async (value: string) => {
    setLanguage(value);
    await saveSetting('settings_language', value);
  };

  const handleDateFormatChange = async (value: string) => {
    setDateFormat(value);
    await saveSetting('settings_dateFormat', value);
  };

  const handleTimeFormatChange = async (value: string) => {
    setTimeFormat(value);
    await saveSetting('settings_timeFormat', value);
  };

  const handleAutoRefreshToggle = async (checked: boolean) => {
    setAutoRefresh(checked);
    await saveSetting('settings_autoRefresh', checked.toString());
  };

  const navigateToChangePassword = () => {
    history.push('/update-password');
  };

  const handleClearCache = async () => {
    setToastMessage('Cache cleared successfully');
    setShowToast(true);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* User Info Card */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={personOutline} style={{ marginRight: '8px' }} />
              Account Information
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList lines="none">
              <IonItem>
                <IonLabel>
                  <p>User ID</p>
                  <h2>{userId}</h2>
                </IonLabel>
              </IonItem>
              <IonItem>
                <IonLabel>
                  <p>Role</p>
                  <h2>
                    <IonBadge color="primary">{userRole || 'N/A'}</IonBadge>
                  </h2>
                </IonLabel>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* Appearance Settings */}
        <IonList>
          <IonListHeader>
            <IonLabel>Appearance</IonLabel>
          </IonListHeader>

          <IonItem>
            <IonIcon icon={moonOutline} slot="start" />
            <IonLabel>
              <h2>Dark Mode</h2>
              <p>Use dark theme</p>
            </IonLabel>
            <IonToggle
              checked={darkMode}
              onIonChange={(e) => handleDarkModeToggle(e.detail.checked)}
            />
          </IonItem>

          <IonItem>
            <IonIcon icon={colorPaletteOutline} slot="start" />
            <IonLabel>
              <h2>Theme Color</h2>
              <p>Choose app color scheme</p>
            </IonLabel>
            <IonSelect value="blue" interface="popover">
              <IonSelectOption value="blue">Blue</IonSelectOption>
              <IonSelectOption value="green">Green</IonSelectOption>
              <IonSelectOption value="purple">Purple</IonSelectOption>
              <IonSelectOption value="red">Red</IonSelectOption>
            </IonSelect>
          </IonItem>
        </IonList>

        {/* Notification Settings */}
        <IonList>
          <IonListHeader>
            <IonLabel>Notifications</IonLabel>
          </IonListHeader>

          <IonItem>
            <IonIcon icon={notificationsOutline} slot="start" />
            <IonLabel>
              <h2>Push Notifications</h2>
              <p>Receive app notifications</p>
            </IonLabel>
            <IonToggle
              checked={notifications}
              onIonChange={(e) => handleNotificationsToggle(e.detail.checked)}
            />
          </IonItem>

          <IonItem>
            <IonIcon icon={mailOutline} slot="start" />
            <IonLabel>
              <h2>Email Notifications</h2>
              <p>Receive updates via email</p>
            </IonLabel>
            <IonToggle
              checked={emailNotifications}
              onIonChange={(e) => handleEmailNotificationsToggle(e.detail.checked)}
              disabled={!notifications}
            />
          </IonItem>

          <IonItem>
            <IonIcon icon={phonePortraitOutline} slot="start" />
            <IonLabel>
              <h2>SMS Notifications</h2>
              <p>Receive updates via SMS</p>
            </IonLabel>
            <IonToggle
              checked={smsNotifications}
              onIonChange={(e) => handleSmsNotificationsToggle(e.detail.checked)}
              disabled={!notifications}
            />
          </IonItem>
        </IonList>

        {/* Language & Region */}
        <IonList>
          <IonListHeader>
            <IonLabel>Language & Region</IonLabel>
          </IonListHeader>

          <IonItem>
            <IonIcon icon={languageOutline} slot="start" />
            <IonLabel>
              <h2>Language</h2>
              <p>App display language</p>
            </IonLabel>
            <IonSelect
              value={language}
              onIonChange={(e) => handleLanguageChange(e.detail.value)}
              interface="popover"
            >
              <IonSelectOption value="en">English</IonSelectOption>
              <IonSelectOption value="bn">Bengali</IonSelectOption>
              <IonSelectOption value="es">Spanish</IonSelectOption>
              <IonSelectOption value="fr">French</IonSelectOption>
              <IonSelectOption value="de">German</IonSelectOption>
            </IonSelect>
          </IonItem>

          <IonItem>
            <IonIcon icon={globeOutline} slot="start" />
            <IonLabel>
              <h2>Date Format</h2>
              <p>How dates are displayed</p>
            </IonLabel>
            <IonSelect
              value={dateFormat}
              onIonChange={(e) => handleDateFormatChange(e.detail.value)}
              interface="popover"
            >
              <IonSelectOption value="MM/DD/YYYY">MM/DD/YYYY</IonSelectOption>
              <IonSelectOption value="DD/MM/YYYY">DD/MM/YYYY</IonSelectOption>
              <IonSelectOption value="YYYY-MM-DD">YYYY-MM-DD</IonSelectOption>
            </IonSelect>
          </IonItem>

          <IonItem>
            <IonIcon icon={timeOutline} slot="start" />
            <IonLabel>
              <h2>Time Format</h2>
              <p>12-hour or 24-hour clock</p>
            </IonLabel>
            <IonSelect
              value={timeFormat}
              onIonChange={(e) => handleTimeFormatChange(e.detail.value)}
              interface="popover"
            >
              <IonSelectOption value="12h">12-hour</IonSelectOption>
              <IonSelectOption value="24h">24-hour</IonSelectOption>
            </IonSelect>
          </IonItem>
        </IonList>

        {/* App Behavior */}
        <IonList>
          <IonListHeader>
            <IonLabel>App Behavior</IonLabel>
          </IonListHeader>

          <IonItem>
            <IonIcon icon={notificationsOutline} slot="start" />
            <IonLabel>
              <h2>Auto Refresh</h2>
              <p>Automatically refresh data</p>
            </IonLabel>
            <IonToggle
              checked={autoRefresh}
              onIonChange={(e) => handleAutoRefreshToggle(e.detail.checked)}
            />
          </IonItem>

          <IonItem button onClick={handleClearCache}>
            <IonIcon icon={informationCircleOutline} slot="start" />
            <IonLabel>
              <h2>Clear Cache</h2>
              <p>Remove temporary data</p>
            </IonLabel>
          </IonItem>
        </IonList>

        {/* Security Settings */}
        <IonList>
          <IonListHeader>
            <IonLabel>Security</IonLabel>
          </IonListHeader>

          <IonItem button onClick={navigateToChangePassword}>
            <IonIcon icon={keyOutline} slot="start" />
            <IonLabel>
              <h2>Change Password</h2>
              <p>Update your password</p>
            </IonLabel>
          </IonItem>

          <IonItem>
            <IonIcon icon={shieldCheckmarkOutline} slot="start" />
            <IonLabel>
              <h2>Two-Factor Authentication</h2>
              <p>Add extra security</p>
            </IonLabel>
            <IonBadge color="warning">Coming Soon</IonBadge>
          </IonItem>
        </IonList>

        {/* About & Support */}
        <IonList>
          <IonListHeader>
            <IonLabel>About & Support</IonLabel>
          </IonListHeader>

          <IonItem button>
            <IonIcon icon={helpCircleOutline} slot="start" />
            <IonLabel>
              <h2>Help & FAQ</h2>
              <p>Get answers to common questions</p>
            </IonLabel>
          </IonItem>

          <IonItem button>
            <IonIcon icon={documentTextOutline} slot="start" />
            <IonLabel>
              <h2>Privacy Policy</h2>
              <p>How we handle your data</p>
            </IonLabel>
          </IonItem>

          <IonItem button>
            <IonIcon icon={documentTextOutline} slot="start" />
            <IonLabel>
              <h2>Terms of Service</h2>
              <p>Terms and conditions</p>
            </IonLabel>
          </IonItem>

          <IonItem>
            <IonIcon icon={informationCircleOutline} slot="start" />
            <IonLabel>
              <h2>App Version</h2>
              <p>1.0.0</p>
            </IonLabel>
          </IonItem>
        </IonList>

        {/* Admin Settings (if admin) */}
        {isAdmin && (
          <IonCard color="warning">
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={shieldCheckmarkOutline} style={{ marginRight: '8px' }} />
                Admin Settings
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList lines="none">
                <IonItem button onClick={() => history.push('/manage-users')}>
                  <IonLabel>
                    <h2>Manage Users</h2>
                    <p>View and manage all users</p>
                  </IonLabel>
                </IonItem>
                <IonItem button>
                  <IonLabel>
                    <h2>System Settings</h2>
                    <p>Configure system-wide settings</p>
                  </IonLabel>
                </IonItem>
                <IonItem button>
                  <IonLabel>
                    <h2>Backup & Restore</h2>
                    <p>Manage data backups</p>
                  </IonLabel>
                </IonItem>
              </IonList>
            </IonCardContent>
          </IonCard>
        )}

        {/* Danger Zone */}
        <IonCard color="danger">
          <IonCardHeader>
            <IonCardTitle>Danger Zone</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonNote>
              <p style={{ marginBottom: '12px' }}>
                These actions are irreversible. Please proceed with caution.
              </p>
            </IonNote>
            <IonButton expand="block" fill="outline" color="light">
              Delete Account
            </IonButton>
          </IonCardContent>
        </IonCard>

        {/* Toast Notification */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default SettingsPage;
