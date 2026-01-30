/**
 * Role-Based Authorization - Central Export
 *
 * Import everything you need for role-based UI from this single file:
 *
 * ```typescript
 * import {
 *   useAuth,
 *   useRole,
 *   RoleGuard,
 *   RoleProtectedRoute,
 *   extractRole,
 * } from '../role-auth';
 * ```
 */

// Hooks
export { useAuth } from '../context/AuthContext';
export { useRole } from '../hooks/useRole';

// Components
export { RoleGuard } from '../components/RoleGuard';
export { default as RoleProtectedRoute } from '../components/RoleProtectedRoute';
export { AuthProviderWithRoleSync } from '../components/AuthProviderWithRoleSync';

// Utilities
export {
  decodeJWT,
  extractRole,
  extractUserId,
  isTokenExpired,
  getAllClaims,
} from '../utils/jwtUtils';

// Types
export type {
  UserRole,
  RoleChangeEvent,
  RoleChangeCallback,
} from '../types';

// Re-export commonly used types from context
export type { default as AuthContext } from '../context/AuthContext';
