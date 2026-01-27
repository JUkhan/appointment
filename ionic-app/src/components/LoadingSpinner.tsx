import React from 'react';
import { IonSpinner } from '@ionic/react';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        gap: '1rem',
      }}
    >
      <IonSpinner name="crescent" />
      {message && <p style={{ color: 'var(--ion-color-medium)' }}>{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
