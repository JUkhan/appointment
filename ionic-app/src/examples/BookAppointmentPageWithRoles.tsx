/**
 * EXAMPLE: BookAppointmentPage with Role-Based UI
 *
 * This is an enhanced version of BookAppointmentPage that demonstrates
 * how to add role-based authorization to an existing page.
 *
 * You can use this as a reference to update your actual BookAppointmentPage.tsx
 */

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
  IonSelect,
  IonSelectOption,
  IonButton,
  IonDatetime,
  IonSpinner,
  IonToast,
  IonBadge,
  IonButtons,
  IonIcon,
  useIonToast,
} from '@ionic/react';
import { personOutline, calendarOutline, timeOutline } from 'ionicons/icons';
import { useRole } from '../hooks/useRole';
import RoleGuard from '../components/RoleGuard';
import apiService from '../services/apiService';
import type { Doctor } from '../types';

const BookAppointmentPageWithRoles: React.FC = () => {
  // Role-based hooks
  const { userRole, isPatient, isReceptionist, isAdmin, onRoleChange } = useRole();
  const [presentToast] = useIonToast();

  // Existing state
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // NEW: Listen for role changes
  useEffect(() => {
    const unsubscribe = onRoleChange((event) => {
      presentToast({
        message: `Your role changed from ${event.oldRole} to ${event.newRole}. Some features may have changed.`,
        duration: 5000,
        color: 'warning',
        position: 'top',
      });

      // Optionally refresh page or redirect based on new role
      if (event.newRole === 'doctor') {
        // Doctors shouldn't book appointments for themselves typically
        // You might redirect them to their schedule page
      }
    });

    return unsubscribe;
  }, [onRoleChange, presentToast]);

  // Load doctors
  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const data = await apiService.getDoctors();
      setDoctors(data);
    } catch (error) {
      console.error('Error loading doctors:', error);
      setToastMessage('Failed to load doctors');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !patientName || !patientAge) {
      setToastMessage('Please fill all fields');
      setShowToast(true);
      return;
    }

    try {
      await apiService.createAppointment({
        doctor_id: selectedDoctor,
        date: selectedDate,
        patient_name: patientName,
        patient_age: patientAge,
      });

      setToastMessage('Appointment booked successfully!');
      setShowToast(true);

      // Reset form
      setSelectedDoctor(null);
      setSelectedDate('');
      setPatientName('');
      setPatientAge(null);
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      setToastMessage(error.message || 'Failed to book appointment');
      setShowToast(true);
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Book Appointment</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <IonSpinner name="crescent" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Book Appointment</IonTitle>

          {/* NEW: Show current role in header */}
          <IonButtons slot="end">
            <IonBadge color="primary" style={{ padding: '8px 12px', marginRight: '12px' }}>
              <IonIcon icon={personOutline} style={{ marginRight: '4px' }} />
              {userRole}
            </IonBadge>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* NEW: Role-specific welcome message */}
        <IonCard color="light">
          <IonCardContent>
            {isPatient && (
              <p>Welcome! Book your appointment by selecting a doctor and preferred time.</p>
            )}
            {isReceptionist && (
              <p>
                <strong>Receptionist Mode:</strong> You can book appointments for patients.
                Enter patient details below.
              </p>
            )}
            {isAdmin && (
              <p>
                <strong>Admin Mode:</strong> You have full access to book appointments
                for any patient.
              </p>
            )}
          </IonCardContent>
        </IonCard>

        {/* NEW: Admin-only stats card */}
        <RoleGuard allowedRoles="admin">
          <IonCard color="warning">
            <IonCardHeader>
              <IonCardTitle>Admin Statistics</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem lines="none">
                <IonLabel>Total Doctors: {doctors.length}</IonLabel>
              </IonItem>
              <IonItem lines="none">
                <IonLabel>Active Booking System: Online</IonLabel>
              </IonItem>
              <IonButton expand="block" size="small">
                View All Appointments
              </IonButton>
            </IonCardContent>
          </IonCard>
        </RoleGuard>

        {/* Main booking form */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={calendarOutline} style={{ marginRight: '8px' }} />
              {isPatient ? 'Book Your Appointment' : 'Book Patient Appointment'}
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {/* Select Doctor */}
            <IonItem>
              <IonLabel position="stacked">Select Doctor</IonLabel>
              <IonSelect
                value={selectedDoctor}
                placeholder="Choose a doctor"
                onIonChange={(e) => setSelectedDoctor(e.detail.value)}
              >
                {doctors.map((doctor) => (
                  <IonSelectOption key={doctor.id} value={doctor.id}>
                    {doctor.name} - {doctor.specialization}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            {/* Select Date */}
            <IonItem>
              <IonLabel position="stacked">
                <IonIcon icon={timeOutline} style={{ marginRight: '4px' }} />
                Select Date & Time
              </IonLabel>
              <IonDatetime
                value={selectedDate}
                onIonChange={(e) => setSelectedDate(e.detail.value as string)}
              />
            </IonItem>

            {/* Patient Name */}
            <IonItem>
              <IonLabel position="stacked">
                {isPatient ? 'Your Name' : 'Patient Name'}
              </IonLabel>
              <IonInput
                value={patientName}
                placeholder={isPatient ? 'Enter your name' : 'Enter patient name'}
                onIonChange={(e) => setPatientName(e.detail.value!)}
              />
            </IonItem>

            {/* Patient Age */}
            <IonItem>
              <IonLabel position="stacked">
                {isPatient ? 'Your Age' : 'Patient Age'}
              </IonLabel>
              <IonInput
                type="number"
                value={patientAge}
                placeholder="Enter age"
                onIonChange={(e) => setPatientAge(parseInt(e.detail.value!, 10))}
              />
            </IonItem>

            {/* NEW: Receptionist/Admin can add priority booking */}
            <RoleGuard allowedRoles={['receptionist', 'admin']}>
              <IonItem>
                <IonLabel>Priority Booking</IonLabel>
                <IonSelect placeholder="Normal">
                  <IonSelectOption value="normal">Normal</IonSelectOption>
                  <IonSelectOption value="urgent">Urgent</IonSelectOption>
                  <IonSelectOption value="emergency">Emergency</IonSelectOption>
                </IonSelect>
              </IonItem>
            </RoleGuard>

            {/* NEW: Admin can assign to specific time slot */}
            <RoleGuard allowedRoles="admin">
              <IonItem>
                <IonLabel position="stacked">Override Serial Number</IonLabel>
                <IonInput
                  type="number"
                  placeholder="Leave empty for auto-assign"
                />
              </IonItem>
            </RoleGuard>

            {/* Book Button */}
            <IonButton
              expand="block"
              onClick={handleBookAppointment}
              style={{ marginTop: '16px' }}
            >
              Book Appointment
            </IonButton>
          </IonCardContent>
        </IonCard>

        {/* NEW: Show different help text based on role */}
        <IonCard color="light">
          <IonCardContent>
            {isPatient && (
              <>
                <strong>Tips for Patients:</strong>
                <ul>
                  <li>Book appointments at least 24 hours in advance</li>
                  <li>Arrive 10 minutes before your scheduled time</li>
                  <li>You can cancel appointments from the "My Appointments" tab</li>
                </ul>
              </>
            )}

            {isReceptionist && (
              <>
                <strong>Receptionist Guide:</strong>
                <ul>
                  <li>Verify patient identity before booking</li>
                  <li>Use priority booking for urgent cases</li>
                  <li>Check doctor availability before confirming</li>
                </ul>
              </>
            )}

            {isAdmin && (
              <>
                <strong>Admin Features:</strong>
                <ul>
                  <li>Override serial numbers if needed</li>
                  <li>Access to all booking statistics</li>
                  <li>Can modify or cancel any appointment</li>
                </ul>
              </>
            )}
          </IonCardContent>
        </IonCard>

        {/* NEW: Admin/Receptionist - Quick Actions */}
        <RoleGuard allowedRoles={['admin', 'receptionist']}>
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Quick Actions</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonButton expand="block" fill="outline">
                View Today's Appointments
              </IonButton>
              <IonButton expand="block" fill="outline">
                Check Doctor Availability
              </IonButton>

              {/* Admin only: Manage doctors */}
              <RoleGuard allowedRoles="admin">
                <IonButton expand="block" fill="outline" color="warning">
                  Manage Doctors
                </IonButton>
              </RoleGuard>
            </IonCardContent>
          </IonCard>
        </RoleGuard>

        {/* Toast for notifications */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
        />
      </IonContent>
    </IonPage>
  );
};

export default BookAppointmentPageWithRoles;

/**
 * HOW TO USE THIS EXAMPLE:
 *
 * 1. Review this file to understand role-based patterns
 * 2. Copy the patterns you need to your actual BookAppointmentPage.tsx
 * 3. Key additions:
 *    - Import useRole hook
 *    - Import RoleGuard component
 *    - Add role change listener
 *    - Show/hide UI based on role
 *    - Customize content per role
 *
 * 4. Common patterns to copy:
 *    - Role badge in header
 *    - Role-specific welcome messages
 *    - RoleGuard for admin-only sections
 *    - Conditional help text
 *    - Quick actions for staff
 */
