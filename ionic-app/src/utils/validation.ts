/**
 * Validation utilities
 */

/**
 * Validate username (minimum 3 characters)
 */
export const validateUsername = (username: string): boolean => {
  return username.trim().length >= 3;
};

/**
 * Validate password (minimum 6 characters)
 */
export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

/**
 * Validate password match
 */
export const validatePasswordMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword && password.length > 0;
};

/**
 * Validate patient name (not empty)
 */
export const validatePatientName = (name: string): boolean => {
  return name.trim().length > 0;
};

/**
 * Validate patient age (optional, but if provided must be positive)
 */
export const validatePatientAge = (age: number | undefined): boolean => {
  if (age === undefined || age === null) return true;
  return age > 0 && age <= 150;
};
