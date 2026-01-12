import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { Colors, Spacing, FontSizes } from '../constants/colors';

const Stack = createStackNavigator();

export const RootNavigator = () => {
  const { isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main">
            {(props) => (
              <View style={styles.container}>
                <View style={styles.header}>
                  <Text style={styles.headerTitle}>
                    Doctor Appointment System
                  </Text>
                  <TouchableOpacity
                    onPress={handleLogout}
                    style={styles.logoutButton}
                  >
                    <Text style={styles.logoutText}>Logout</Text>
                  </TouchableOpacity>
                </View>
                <MainTabs />
              </View>
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.primary,
    paddingTop: 50, // Adjust for status bar
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.white,
    flex: 1,
  },
  logoutButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: 6,
  },
  logoutText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: FontSizes.sm,
  },
});
