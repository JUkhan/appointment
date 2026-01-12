import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Card } from './Card';
import { Appointment } from '../services/apiService';
import { calculateTimeSlot, formatDate } from '../utils/timeSlot';
import { Colors, Spacing, FontSizes } from '../constants/colors';

interface AppointmentCardProps {
  appointment: Appointment;
  onCancel: (id: number) => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onCancel,
}) => {
  const handleCancel = () => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => onCancel(appointment.id),
        },
      ]
    );
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.doctorName}>Dr. {appointment.doctor_name}</Text>
        <Text style={styles.serialNumber}>#{appointment.serial_number}</Text>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date:</Text>
          <Text style={styles.detailValue}>{formatDate(appointment.date)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Time:</Text>
          <Text style={styles.detailValue}>
            {calculateTimeSlot(appointment.availability, appointment.serial_number)}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
        <Text style={styles.cancelButtonText}>Cancel Appointment</Text>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  doctorName: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  serialNumber: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.primary,
    backgroundColor: Colors.primaryLight + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
  },
  details: {
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  detailLabel: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    width: 60,
  },
  detailValue: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: '500',
    flex: 1,
  },
  cancelButton: {
    backgroundColor: Colors.error,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
});
