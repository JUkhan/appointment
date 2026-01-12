import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from './Card';
import { Doctor } from '../services/apiService';
import { Colors, Spacing, FontSizes } from '../constants/colors';

interface DoctorCardProps {
  doctor: Doctor;
  isSelected: boolean;
  onSelect: () => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  isSelected,
  onSelect,
}) => {
  return (
    <TouchableOpacity onPress={onSelect} activeOpacity={0.7}>
      <Card style={[styles.card, isSelected && styles.selectedCard]}>
        <View style={styles.content}>
          <View style={styles.info}>
            <Text style={styles.doctorName}>{doctor.name}</Text>
            <Text style={styles.specialization}>{doctor.specialization}</Text>
          </View>
          <View style={styles.availability}>
            <Text style={styles.availabilityLabel}>Available</Text>
            <Text style={styles.availabilityTime}>{doctor.availability}</Text>
          </View>
        </View>
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.selectedText}>✓</Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.transparent,
  },
  selectedCard: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '10',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  doctorName: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  specialization: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  availability: {
    alignItems: 'flex-end',
  },
  availabilityLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  availabilityTime: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.success,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedText: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontWeight: '700',
  },
});
