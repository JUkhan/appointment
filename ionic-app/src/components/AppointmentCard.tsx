import React from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonBadge,
} from '@ionic/react';
import { personCircleOutline, calendarOutline, personOutline, medkitOutline } from 'ionicons/icons';
import type { Appointment } from '../types';
import { formatAppointmentDate } from '../utils/dateFormat';

interface AppointmentCardProps {
  appointment: Appointment;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment }) => {
  return (
    <IonCard>
      <IonCardHeader>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <IonCardTitle style={{ fontSize: '1.1rem', fontWeight: 600 }}>
            <IonIcon icon={personCircleOutline} style={{ marginRight: '0.5rem' }} />
            {appointment.doctor_name}
          </IonCardTitle>
          <IonBadge color="primary">Serial #{appointment.serial_number}</IonBadge>
        </div>
      </IonCardHeader>
      <IonCardContent>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <IonIcon icon={calendarOutline} style={{ marginRight: '0.5rem', color: 'var(--ion-color-medium)' }} />
            <span>{formatAppointmentDate(appointment.date)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <IonIcon icon={medkitOutline} style={{ marginRight: '0.5rem', color: 'var(--ion-color-medium)' }} />
            <span>{appointment.availability}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <IonIcon icon={personOutline} style={{ marginRight: '0.5rem', color: 'var(--ion-color-medium)' }} />
            <span>
              Patient: {appointment.patient_name}
              {appointment.patient_age && ` (Age: ${appointment.patient_age})`}
            </span>
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default AppointmentCard;
