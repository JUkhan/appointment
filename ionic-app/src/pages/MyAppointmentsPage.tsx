import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonToast,
  IonAlert,
  IonCard,
  IonCardContent,
  IonText,
  IonButton,
  IonIcon,
  IonButtons,
  IonMenuButton,
  useIonViewWillEnter,
} from '@ionic/react';
import { closeCircleOutline } from 'ionicons/icons';
import { RefresherEventDetail } from '@ionic/core';
import apiService from '../services/apiService';
import AppointmentCard from '../components/AppointmentCard';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Appointment } from '../types';

const MyAppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('danger');
  const [showAlert, setShowAlert] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);

  // Fetch appointments every time the page/tab is viewed
  useIonViewWillEnter(() => {
    fetchAppointments();
  });

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getAppointments();
      setAppointments(data);
    } catch (error: any) {
      setToastMessage(error.message || 'Failed to load appointments');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    try {
      const data = await apiService.getAppointments();
      setAppointments(data);
    } catch (error: any) {
      setToastMessage(error.message || 'Failed to refresh appointments');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      event.detail.complete();
    }
  };

  const handleCancelClick = (appointmentId: number) => {
    setSelectedAppointmentId(appointmentId);
    setShowAlert(true);
  };

  const handleConfirmCancel = async () => {
    if (selectedAppointmentId === null) return;

    try {
      await apiService.cancelAppointment(selectedAppointmentId);

      // Remove the cancelled appointment from the list
      setAppointments((prev) =>
        prev.filter((appointment) => appointment.id !== selectedAppointmentId)
      );

      setToastMessage('Appointment cancelled successfully');
      setToastColor('success');
      setShowToast(true);
    } catch (error: any) {
      setToastMessage(error.response?.data?.message || 'Failed to cancel appointment');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setSelectedAppointmentId(null);
      setShowAlert(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>My Appointments</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {isLoading ? (
          <LoadingSpinner message="Loading appointments..." />
        ) : (
          <div className="ion-padding">
            {!appointments || appointments.length === 0 ? (
              <IonCard>
                <IonCardContent>
                  <IonText color="medium">
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                      <h3>No Appointments</h3>
                      <p>You don't have any appointments yet.</p>
                      <p>Book an appointment from the Book tab!</p>
                    </div>
                  </IonText>
                </IonCardContent>
              </IonCard>
            ) : (
              <IonList>
                {appointments.map((appointment) => (
                  <div key={appointment.id} style={{ marginBottom: '1rem' }}>
                    <AppointmentCard appointment={appointment} />
                    <IonButton
                      expand="block"
                      color="danger"
                      fill="outline"
                      onClick={() => handleCancelClick(appointment.id)}
                      style={{ margin: '0 16px 8px 16px' }}
                    >
                      <IonIcon slot="start" icon={closeCircleOutline} />
                      Cancel Appointment
                    </IonButton>
                  </div>
                ))}
              </IonList>
            )}
          </div>
        )}

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Cancel Appointment"
          message="Are you sure you want to cancel this appointment?"
          buttons={[
            {
              text: 'No',
              role: 'cancel',
            },
            {
              text: 'Yes',
              handler: handleConfirmCancel,
            },
          ]}
        />

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

export default MyAppointmentsPage;
