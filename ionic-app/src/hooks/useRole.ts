import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole, RoleChangeEvent } from '../types';

/**
 * Custom hook for role-based logic and role change notifications
 *
 * Usage:
 * ```tsx
 * const { userRole, hasRole, isAdmin, onRoleChange } = useRole();
 *
 * // Check specific role
 * if (hasRole('admin')) {
 *   // Do something
 * }
 *
 * // Check multiple roles
 * if (hasRole(['admin', 'doctor'])) {
 *   // Do something
 * }
 *
 * // Subscribe to role changes
 * useEffect(() => {
 *   const unsubscribe = onRoleChange((event) => {
 *     console.log('Role changed from', event.oldRole, 'to', event.newRole);
 *     // Handle role change (e.g., redirect, show notification, refresh data)
 *   });
 *
 *   return unsubscribe;
 * }, []);
 * ```
 */
export const useRole = () => {
  const { userRole, hasRole, onRoleChange: subscribeToRoleChange } = useAuth();
  const [roleChangeCount, setRoleChangeCount] = useState(0);

  /**
   * Subscribe to role changes with a callback
   */
  const onRoleChange = useCallback((callback: (event: RoleChangeEvent) => void) => {
    return subscribeToRoleChange(callback);
  }, [subscribeToRoleChange]);

  /**
   * Effect to track role changes internally
   */
  useEffect(() => {
    const unsubscribe = subscribeToRoleChange(() => {
      setRoleChangeCount(prev => prev + 1);
    });

    return unsubscribe;
  }, [subscribeToRoleChange]);

  /**
   * Helper: Check if user is admin
   */
  const isAdmin = hasRole('admin');

  /**
   * Helper: Check if user is doctor
   */
  const isDoctor = hasRole('doctor');

  /**
   * Helper: Check if user is patient
   */
  const isPatient = hasRole('patient');

  /**
   * Helper: Check if user is receptionist
   */
  const isReceptionist = hasRole('receptionist');

  const isUser = hasRole('user');

  return {
    userRole,
    hasRole,
    onRoleChange,
    roleChangeCount,
    // Common role checks
    isAdmin,
    isDoctor,
    isPatient,
    isReceptionist,
    isUser,
  };
};

export default useRole;
