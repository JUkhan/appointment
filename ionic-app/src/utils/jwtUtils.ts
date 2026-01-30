/**
 * JWT Utility functions for decoding and extracting claims
 */

export interface JWTPayload {
  role?: string;
  user_id?: number;
  exp?: number;
  iat?: number;
  [key: string]: any;
}

/**
 * Decode JWT token (without verification - verification happens on backend)
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT format');
      return null;
    }

    // Decode the payload (base64url)
    const payload = parts[1];
    const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodedPayload) as JWTPayload;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

/**
 * Extract role from JWT token
 * @param token - JWT token string
 * @returns Role string or null if not found
 */
export const extractRole = (token: string): string | null => {
  const payload = decodeJWT(token);
  return payload?.role || null;
};

/**
 * Extract user ID from JWT token
 * @param token - JWT token string
 * @returns User ID or null if not found
 */
export const extractUserId = (token: string): number | null => {
  const payload = decodeJWT(token);
  return payload?.user_id || null;
};

/**
 * Check if JWT token is expired
 * @param token - JWT token string
 * @returns true if expired, false otherwise
 */
export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJWT(token);
  if (!payload?.exp) {
    return true;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
};

/**
 * Get all claims from JWT token
 * @param token - JWT token string
 * @returns JWT payload object or null
 */
export const getAllClaims = (token: string): JWTPayload | null => {
  return decodeJWT(token);
};
