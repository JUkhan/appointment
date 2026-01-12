/**
 * Validate username
 * @param username - Username string
 * @returns Error message or null if valid
 */
export const validateUsername = (username: string): string | null => {
  if (!username || username.trim().length === 0) {
    return 'Username is required';
  }
  if (username.length < 3) {
    return 'Username must be at least 3 characters';
  }
  return null;
};

/**
 * Validate password
 * @param password - Password string
 * @returns Error message or null if valid
 */
export const validatePassword = (password: string): string | null => {
  if (!password || password.trim().length === 0) {
    return 'Password is required';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;
};

/**
 * Validate password confirmation
 * @param password - Password string
 * @param confirmPassword - Confirm password string
 * @returns Error message or null if valid
 */
export const validatePasswordConfirmation = (
  password: string,
  confirmPassword: string
): string | null => {
  if (!confirmPassword || confirmPassword.trim().length === 0) {
    return 'Please confirm your password';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  return null;
};
