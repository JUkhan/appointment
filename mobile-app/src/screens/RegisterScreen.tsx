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
import {
  validateUsername,
  validatePassword,
  validatePasswordConfirmation,
} from '../utils/validation';

export const RegisterScreen = ({ navigation }: any) => {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });

  const handleRegister = async () => {
    // Validate inputs
    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);
    const confirmPasswordError = validatePasswordConfirmation(
      password,
      confirmPassword
    );

    if (usernameError || passwordError || confirmPasswordError) {
      setErrors({
        username: usernameError || '',
        password: passwordError || '',
        confirmPassword: confirmPasswordError || '',
      });
      return;
    }

    setErrors({ username: '', password: '', confirmPassword: '' });
    setLoading(true);

    try {
      await register({ username, password });
      Alert.alert(
        'Registration Successful',
        'Your account has been created. Please login to continue.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Sign up to start booking appointments
          </Text>

          <View style={styles.form}>
            <Input
              label="Username"
              value={username}
              onChangeText={setUsername}
              placeholder="Choose a username"
              autoCapitalize="none"
              error={errors.username}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Choose a password (min. 6 characters)"
              secureTextEntry
              autoCapitalize="none"
              error={errors.password}
            />

            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter your password"
              secureTextEntry
              autoCapitalize="none"
              error={errors.confirmPassword}
            />

            <Button
              title="Register"
              onPress={handleRegister}
              loading={loading}
              style={styles.registerButton}
            />

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <Button
                title="Login"
                onPress={() => navigation.navigate('Login')}
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
  registerButton: {
    marginTop: Spacing.md,
  },
  loginContainer: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  loginText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
});
