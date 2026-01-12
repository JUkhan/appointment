import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Colors, Spacing, FontSizes } from '../constants/colors';
import { validateUsername, validatePassword } from '../utils/validation';

export const LoginScreen = ({ navigation }: any) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ username: '', password: '' });

  const handleLogin = async () => {
    // Validate inputs
    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);

    if (usernameError || passwordError) {
      setErrors({
        username: usernameError || '',
        password: passwordError || '',
      });
      return;
    }

    setErrors({ username: '', password: '' });
    setLoading(true);

    try {
      await login({ username, password });
      // Navigation is handled by AuthContext
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Sign in to book your next appointment
          </Text>

          <View style={styles.form}>
            <Input
              label="Username"
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your username"
              autoCapitalize="none"
              error={errors.username}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              autoCapitalize="none"
              error={errors.password}
            />

            <Button
              title="Login"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
            />

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <Button
                title="Register"
                onPress={() => navigation.navigate('Register')}
                variant="outline"
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSizes.xxxl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  loginButton: {
    marginTop: Spacing.md,
  },
  registerContainer: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  registerText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
});
