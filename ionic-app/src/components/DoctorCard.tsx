import React from 'react';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon } from '@ionic/react';
import { personCircleOutline, medkitOutline, timeOutline } from 'ionicons/icons';
import type { Doctor } from '../types';

interface DoctorCardProps {
  doctor: Doctor;
  selected?: boolean;
  onSelect?: () => void;
}

const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, selected = false, onSelect }) => {
  return (
    <IonCard
      button
      onClick={onSelect}
      style={{
        border: selected ? '2px solid var(--ion-color-primary)' : '1px solid var(--ion-color-light)',
        backgroundColor: selected ? 'var(--ion-color-primary-tint)' : 'white',
      }}
    >
      <IonCardHeader>
        <IonCardTitle style={{ fontSize: '1.1rem', fontWeight: 600 }}>
          <IonIcon icon={personCircleOutline} style={{ marginRight: '0.5rem' }} />
          {doctor.name}
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <IonIcon icon={medkitOutline} style={{ marginRight: '0.5rem', color: 'var(--ion-color-medium)' }} />
            <span>{doctor.specialization}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <IonIcon icon={timeOutline} style={{ marginRight: '0.5rem', color: 'var(--ion-color-medium)' }} />
            <span>{doctor.availability}</span>
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default DoctorCard;
