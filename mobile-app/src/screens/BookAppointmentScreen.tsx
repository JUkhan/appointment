import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { apiService, Doctor } from '../services/apiService';
import { DoctorCard } from '../components/DoctorCard';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Colors, Spacing, FontSizes } from '../constants/colors';
import { formatDateForAPI, formatDate } from '../utils/timeSlot';

export const BookAppointmentScreen = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const data = await apiService.getDoctors();
      setDoctors(data);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load doctors. Please try again.');
      console.error('Error fetching doctors:', error);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor) {
      Alert.alert('Select Doctor', 'Please select a doctor to continue.');
      return;
    }

    // Check if selected date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);

    if (selected < today) {
      Alert.alert('Invalid Date', 'Please select a future date.');
      return;
    }

    setBooking(true);

    try {
      const response = await apiService.createAppointment({
        doctor_id: selectedDoctor.id,
        date: formatDateForAPI(selectedDate),
      });

      Alert.alert(
        'Success',
        `Appointment booked successfully!\n\nDoctor: Dr. ${selectedDoctor.name}\nDate: ${formatDate(
          selectedDate
        )}\nSerial Number: ${response.appointment.serial_number}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setSelectedDoctor(null);
              setSelectedDate(new Date());
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Booking Failed',
        error.response?.data?.error || 'Failed to book appointment. Please try again.'
      );
      console.error('Error booking appointment:', error);
    } finally {
      setBooking(false);
    }
  };

  if (loadingDoctors) {
    return <LoadingSpinner message="Loading doctors..." />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.sectionTitle}>Select a Doctor</Text>
        {doctors.length === 0 ? (
          <Text style={styles.emptyText}>No doctors available at the moment.</Text>
        ) : (
          doctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              isSelected={selectedDoctor?.id === doctor.id}
              onSelect={() => setSelectedDoctor(doctor)}
            />
          ))
        )}

        <Text style={styles.sectionTitle}>Select Date</Text>
        <Button
          title={formatDate(selectedDate)}
          onPress={() => setShowDatePicker(true)}
          variant="outline"
          style={styles.dateButton}
        />

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Book Appointment"
          onPress={handleBookAppointment}
          loading={booking}
          disabled={!selectedDoctor || booking}
          style={styles.bookButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  dateButton: {
    marginBottom: Spacing.md,
  },
  footer: {
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  bookButton: {
    width: '100%',
  },
});
