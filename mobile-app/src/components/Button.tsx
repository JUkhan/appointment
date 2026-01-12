import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Spacing, BorderRadius, FontSizes } from '../constants/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}) => {
  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondary;
      case 'outline':
        return styles.outline;
      case 'destructive':
        return styles.destructive;
      default:
        return styles.primary;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryText;
      case 'outline':
        return styles.outlineText;
      case 'destructive':
        return styles.destructiveText;
      default:
        return styles.primaryText;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'destructive' ? Colors.white : Colors.primary}
        />
      ) : (
        <Text style={[styles.buttonText, getTextStyle()]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  outline: {
    backgroundColor: Colors.transparent,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  destructive: {
    backgroundColor: Colors.error,
  },
  disabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  primaryText: {
    color: Colors.white,
  },
  outlineText: {
    color: Colors.primary,
  },
  secondaryText: {
    color: Colors.text,
  },
  destructiveText: {
    color: Colors.white,
  },
});
