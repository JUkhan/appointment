import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BookAppointmentScreen } from '../screens/BookAppointmentScreen';
import { MyAppointmentsScreen } from '../screens/MyAppointmentsScreen';
import { VoiceAssistantScreen } from '../screens/VoiceAssistantScreen';
import { Colors } from '../constants/colors';

const Tab = createBottomTabNavigator();

export const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.primary,
        },
        headerTintColor: Colors.white,
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Book"
        component={BookAppointmentScreen}
        options={{
          title: 'Book Appointment',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>📅</Text>,
        }}
      />
      <Tab.Screen
        name="MyAppointments"
        component={MyAppointmentsScreen}
        options={{
          title: 'My Appointments',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>📋</Text>,
        }}
      />
      <Tab.Screen
        name="VoiceAssistant"
        component={VoiceAssistantScreen}
        options={{
          title: 'Voice Assistant',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🎤</Text>,
        }}
      />
    </Tab.Navigator>
  );
};
