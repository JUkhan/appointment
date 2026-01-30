import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonSearchbar,
  IonList,
  IonButton,
  IonToast,
  IonModal,
  IonDatetime,
  IonItem,
  IonInput,
  IonCard,
  IonCardContent,
  IonText,
} from '@ionic/react';
import apiService from '../services/apiService';
import DoctorCard from '../components/DoctorCard';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Doctor } from '../types';
import { validatePatientName, validatePatientAge } from '../utils/validation';
import { formatDateForAPI } from '../utils/dateFormat';

const BookAppointmentPage: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showDateModal, setShowDateModal] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState<string>('');
  const [isBooking, setIsBooking] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('danger');

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [searchQuery, doctors]);

  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getDoctors();
      setDoctors(data);
      setFilteredDoctors(data);
    } catch (error: any) {
      setToastMessage(error.message || 'Failed to load doctors');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const filterDoctors = () => {
    if (!searchQuery.trim()) {
      setFilteredDoctors(doctors);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = doctors.filter(
      (doctor) =>
        doctor.name.toLowerCase().includes(query) ||
        doctor.specialization.toLowerCase().includes(query)
    );
    setFilteredDoctors(filtered);
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
  };

  const handleDateConfirm = (value: string | string[] | null | undefined) => {
    if (value && typeof value === 'string') {
      setSelectedDate(value);
      setShowDateModal(false);
    }
  };

  const handleBookAppointment = async () => {
    // Validation
    if (!selectedDoctor) {
      setToastMessage('Please select a doctor');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    if (!selectedDate) {
      setToastMessage('Please select a date');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    if (!validatePatientName(patientName)) {
      setToastMessage('Please enter patient name');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    if (!patientAge || patientAge.trim() === '') {
      setToastMessage('Please enter patient age');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    const age = parseInt(patientAge);
    if (!validatePatientAge(age)) {
      setToastMessage('Please enter a valid age (1-150)');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    setIsBooking(true);
    try {
      await apiService.createAppointment({
        doctor_id: selectedDoctor.id,
        date: formatDateForAPI(new Date(selectedDate)),
        patient_name: patientName,
        patient_age: age,
      });

      setToastMessage('Appointment booked successfully!');
      setToastColor('success');
      setShowToast(true);

      // Reset form
      setSelectedDoctor(null);
      setSelectedDate('');
      setPatientName('');
      setPatientAge('');
    } catch (error: any) {
      setToastMessage(error.response?.data?.message || 'Failed to book appointment');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setIsBooking(false);
    }
  };

  const getTodayISO = () => {
    const today = new Date();
    return today.toISOString();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Book Appointment</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {isLoading ? (
          <LoadingSpinner message="Loading doctors..." />
        ) : (
          <>
            <div style={{ padding: '1rem 0 0.5rem 0' }}>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>Select a Doctor *</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)', margin: 0 }}>
                Choose a doctor to book an appointment
              </p>
            </div>

            <IonSearchbar
              value={searchQuery}
              onIonInput={(e) => setSearchQuery(e.detail.value || '')}
              placeholder="Search doctors by name or specialization"
            />

            <IonList>
              {!filteredDoctors || filteredDoctors.length === 0 ? (
                <IonCard>
                  <IonCardContent>
                    <IonText color="medium">
                      <p style={{ textAlign: 'center' }}>No doctors found</p>
                    </IonText>
                  </IonCardContent>
                </IonCard>
              ) : (
                filteredDoctors.map((doctor) => (
                  <DoctorCard
                    key={doctor.id}
                    doctor={doctor}
                    selected={selectedDoctor?.id === doctor.id}
                    onSelect={() => handleDoctorSelect(doctor)}
                  />
                ))
              )}
            </IonList>

            {selectedDoctor && (
              <div style={{ marginTop: '1rem' }}>
                <IonCard>
                  <IonCardContent>
                    <h3>Appointment Details</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)', marginBottom: '1rem' }}>
                      * All fields are required
                    </p>

                    <IonButton
                      expand="block"
                      onClick={() => setShowDateModal(true)}
                      style={{ marginTop: '1rem' }}
                      color={!selectedDate ? 'medium' : 'primary'}
                    >
                      {selectedDate
                        ? `Selected: ${new Date(selectedDate).toLocaleDateString()}`
                        : 'Select Date *'}
                    </IonButton>

                    <IonItem>
                      <IonInput
                        type="text"
                        label="Patient Name"
                        labelPlacement="floating"
                        placeholder="Enter Patient Name *"
                        value={patientName}
                        onIonInput={(e) => setPatientName(e.detail.value || '')}
                        disabled={isBooking}
                        required
                      />
                    </IonItem>

                    <IonItem>
                      <IonInput
                        type="number"
                        label="Patient Age"
                        labelPlacement="floating"
                        placeholder="Enter Patient Age *"
                        value={patientAge}
                        onIonInput={(e) => setPatientAge(e.detail.value || '')}
                        disabled={isBooking}
                        min="1"
                        max="150"
                        required
                      />
                    </IonItem>

                    <IonButton
                      expand="block"
                      onClick={handleBookAppointment}
                      disabled={isBooking}
                      style={{ marginTop: '1rem' }}
                    >
                      {isBooking ? 'Booking...' : 'Book Appointment'}
                    </IonButton>
                  </IonCardContent>
                </IonCard>
              </div>
            )}
          </>
        )}

        <IonModal isOpen={showDateModal} onDidDismiss={() => setShowDateModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Select Date</IonTitle>
              <IonButton slot="end" onClick={() => setShowDateModal(false)}>
                Close
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonDatetime
              presentation="date"
              value={selectedDate || getTodayISO()}
              onIonChange={(e) => handleDateConfirm(e.detail.value)}
              min={getTodayISO()}
            />
          </IonContent>
        </IonModal>

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

export default BookAppointmentPage;
