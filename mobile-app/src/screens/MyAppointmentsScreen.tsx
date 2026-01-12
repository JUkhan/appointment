import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { apiService, Appointment } from '../services/apiService';
import { AppointmentCard } from '../components/AppointmentCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Colors, Spacing, FontSizes } from '../constants/colors';

export const MyAppointmentsScreen = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch appointments when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
    }, [])
  );

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAppointments();
      setAppointments(data);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load appointments. Please try again.');
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const handleCancelAppointment = async (appointmentId: number) => {
    try {
      await apiService.cancelAppointment(appointmentId);
      Alert.alert('Success', 'Appointment cancelled successfully.');

      // Remove the cancelled appointment from the list
      setAppointments((prev) =>
        prev.filter((appointment) => appointment.id !== appointmentId)
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to cancel appointment. Please try again.'
      );
      console.error('Error cancelling appointment:', error);
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Appointments</Text>
      <Text style={styles.emptyText}>
        You don't have any appointments scheduled yet.
        {'\n'}
        Book an appointment to get started!
      </Text>
    </View>
  );

  if (loading) {
    return <LoadingSpinner message="Loading appointments..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <AppointmentCard
            appointment={item}
            onCancel={handleCancelAppointment}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          appointments.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: Spacing.md,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
