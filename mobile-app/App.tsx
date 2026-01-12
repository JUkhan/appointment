import React, { useEffect, useState } from 'react';
import { StatusBar, View, Text, StyleSheet, Button } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { Colors } from './src/constants/colors';
import { API_BASE_URL } from './src/constants/api';
import axios from 'axios';

// Debug: Log API URL on app start
console.log('🔗 API Base URL:', API_BASE_URL);

// Debug mode component
const DEBUG_MODE = false; // Set to true to enable debug screen

function DebugScreen() {
  const [status, setStatus] = useState('Testing connection...');
  const [doctors, setDoctors] = useState<any>(null);

  const testConnection = async () => {
    setStatus('Testing connection...');
    setDoctors(null);

    try {
      console.log('Attempting to fetch from:', `${API_BASE_URL}/doctors`);
      const response = await axios.get(`${API_BASE_URL}/doctors`, {
        timeout: 10000,
      });
      console.log('Response received:', response.data);
      setStatus('✅ Connection successful!');
      setDoctors(response.data);
    } catch (error: any) {
      console.error('Connection error:', error);
      setStatus(`❌ Error: ${error.message}\n\nCode: ${error.code}\n\nURL: ${API_BASE_URL}`);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <View style={styles.debugContainer}>
      <Text style={styles.debugTitle}>Connection Test</Text>
      <Text style={styles.debugText}>API URL: {API_BASE_URL}</Text>
      <Text style={styles.debugText}>{status}</Text>
      {doctors && <Text style={styles.debugText}>Doctors: {JSON.stringify(doctors, null, 2)}</Text>}
      <Button title="Test Again" onPress={testConnection} />
    </View>
  );
}

export default function App() {
  if (DEBUG_MODE) {
    return <DebugScreen />;
  }

  return (
    <AuthProvider>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  debugContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  debugTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  debugText: {
    fontSize: 14,
    marginBottom: 10,
  },
});
