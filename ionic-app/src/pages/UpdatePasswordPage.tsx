import React, { useState } from 'react';
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
  IonToast,
  IonSpinner,
  IonButtons,
  IonMenuButton,
  IonText,
  IonNote,
} from '@ionic/react';
import {
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import apiService from '../services/apiService';
import storageService from '../services/storageService';
import { TOKEN_KEYS } from '../constants/api';

const UpdatePasswordPage: React.FC = () => {
  const history = useHistory();

  // Form state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning'>('success');

  // Validation errors
  const [errors, setErrors] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const validateForm = (): boolean => {
    const newErrors = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    };

    let isValid = true;

    // Validate old password
    if (!oldPassword.trim()) {
      newErrors.oldPassword = 'Current password is required';
      isValid = false;
    }

    // Validate new password
    if (!newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
      isValid = false;
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
      isValid = false;
    } else if (newPassword === oldPassword) {
      newErrors.newPassword = 'New password must be different from current password';
      isValid = false;
    }

    // Validate confirm password
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your new password';
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const getPasswordStrength = (password: string): {
    strength: string;
    color: string;
    score: number;
  } => {
    if (!password) {
      return { strength: '', color: '', score: 0 };
    }

    let score = 0;

    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    // Character variety
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    if (score <= 2) {
      return { strength: 'Weak', color: 'danger', score };
    } else if (score <= 4) {
      return { strength: 'Medium', color: 'warning', score };
    } else {
      return { strength: 'Strong', color: 'success', score };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user ID from storage
      const userId = await storageService.getItem(TOKEN_KEYS.USER_ID);

      if (!userId) {
        setToastMessage('User ID not found. Please login again.');
        setToastColor('danger');
        setShowToast(true);
        return;
      }

      // Note: In a real implementation, you would verify the old password on the backend
      // For now, we'll just send the new password to update
      await apiService.updateDataUser(userId, {
        new_password: newPassword,
        old_password: oldPassword,
      });

      setToastMessage('Password updated successfully!');
      setToastColor('success');
      setShowToast(true);

      // Clear form
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({ oldPassword: '', newPassword: '', confirmPassword: '' });

      // Redirect to home after 2 seconds
      setTimeout(() => {
        history.push('/tabs/book');
      }, 2000);

    } catch (error: any) {
      console.error('Error updating password:', error);
      setToastMessage(error.response?.data?.error || 'Failed to update password. Please try again.');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    history.goBack();
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Change Password</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={lockClosedOutline} style={{ marginRight: '8px' }} />
              Update Your Password
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText color="medium">
              <p>
                Choose a strong password to keep your account secure.
                Your password must be at least 6 characters long.
              </p>
            </IonText>

            <form onSubmit={handleSubmit}>
              {/* Current Password */}
              <IonItem className={errors.oldPassword ? 'ion-invalid' : ''}>
                <IonLabel position="stacked">
                  Current Password <IonText color="danger">*</IonText>
                </IonLabel>
                <IonInput
                  type={showOldPassword ? 'text' : 'password'}
                  value={oldPassword}
                  onIonInput={(e) => {
                    setOldPassword(e.detail.value!);
                    setErrors({ ...errors, oldPassword: '' });
                  }}
                  placeholder="Enter your current password"
                  required
                />
                <IonButton
                  slot="end"
                  fill="clear"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                >
                  <IonIcon
                    icon={showOldPassword ? eyeOffOutline : eyeOutline}
                    slot="icon-only"
                  />
                </IonButton>
              </IonItem>
              {errors.oldPassword && (
                <IonText color="danger">
                  <p style={{ fontSize: '12px', marginLeft: '16px' }}>
                    <IonIcon icon={closeCircleOutline} /> {errors.oldPassword}
                  </p>
                </IonText>
              )}

              {/* New Password */}
              <IonItem className={errors.newPassword ? 'ion-invalid' : ''} style={{ marginTop: '16px' }}>
                <IonLabel position="stacked">
                  New Password <IonText color="danger">*</IonText>
                </IonLabel>
                <IonInput
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onIonInput={(e) => {
                    setNewPassword(e.detail.value!);
                    setErrors({ ...errors, newPassword: '' });
                  }}
                  placeholder="Enter your new password"
                  required
                />
                <IonButton
                  slot="end"
                  fill="clear"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  <IonIcon
                    icon={showNewPassword ? eyeOffOutline : eyeOutline}
                    slot="icon-only"
                  />
                </IonButton>
              </IonItem>
              {errors.newPassword && (
                <IonText color="danger">
                  <p style={{ fontSize: '12px', marginLeft: '16px' }}>
                    <IonIcon icon={closeCircleOutline} /> {errors.newPassword}
                  </p>
                </IonText>
              )}

              {/* Password Strength Indicator */}
              {newPassword && !errors.newPassword && (
                <div style={{ marginLeft: '16px', marginTop: '8px' }}>
                  <IonText color={passwordStrength.color}>
                    <p style={{ fontSize: '12px', margin: 0 }}>
                      <IonIcon icon={checkmarkCircleOutline} />
                      {' '}Password Strength: <strong>{passwordStrength.strength}</strong>
                    </p>
                  </IonText>
                </div>
              )}

              {/* Confirm Password */}
              <IonItem className={errors.confirmPassword ? 'ion-invalid' : ''} style={{ marginTop: '16px' }}>
                <IonLabel position="stacked">
                  Confirm New Password <IonText color="danger">*</IonText>
                </IonLabel>
                <IonInput
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onIonInput={(e) => {
                    setConfirmPassword(e.detail.value!);
                    setErrors({ ...errors, confirmPassword: '' });
                  }}
                  placeholder="Re-enter your new password"
                  required
                />
                <IonButton
                  slot="end"
                  fill="clear"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <IonIcon
                    icon={showConfirmPassword ? eyeOffOutline : eyeOutline}
                    slot="icon-only"
                  />
                </IonButton>
              </IonItem>
              {errors.confirmPassword && (
                <IonText color="danger">
                  <p style={{ fontSize: '12px', marginLeft: '16px' }}>
                    <IonIcon icon={closeCircleOutline} /> {errors.confirmPassword}
                  </p>
                </IonText>
              )}

              {/* Password matches indicator */}
              {confirmPassword && newPassword === confirmPassword && !errors.confirmPassword && (
                <div style={{ marginLeft: '16px', marginTop: '8px' }}>
                  <IonText color="success">
                    <p style={{ fontSize: '12px', margin: 0 }}>
                      <IonIcon icon={checkmarkCircleOutline} /> Passwords match
                    </p>
                  </IonText>
                </div>
              )}

              {/* Buttons */}
              <div style={{ marginTop: '24px' }}>
                <IonButton
                  expand="block"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <IonSpinner name="crescent" style={{ marginRight: '8px' }} />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </IonButton>

                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  style={{ marginTop: '8px' }}
                >
                  Cancel
                </IonButton>
              </div>
            </form>
          </IonCardContent>
        </IonCard>

        {/* Password Tips */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Password Tips</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText color="medium">
              <p style={{ fontSize: '14px' }}>Create a strong password by including:</p>
              <ul style={{ fontSize: '14px', paddingLeft: '20px' }}>
                <li>At least 8 characters (12+ recommended)</li>
                <li>Uppercase and lowercase letters</li>
                <li>Numbers</li>
                <li>Special characters (!@#$%^&*)</li>
              </ul>
              <IonNote>
                <p style={{ fontSize: '12px' }}>
                  Avoid using common words, personal information, or sequences like "123456".
                </p>
              </IonNote>
            </IonText>
          </IonCardContent>
        </IonCard>

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

export default UpdatePasswordPage;
