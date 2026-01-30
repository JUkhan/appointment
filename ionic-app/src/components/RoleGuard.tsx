import React, { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface RoleGuardProps {
  /**
   * Required role(s) to view the children
   * Can be a single role or an array of roles
   */
  allowedRoles: UserRole | UserRole[];

  /**
   * Content to render if user has required role
   */
  children: ReactNode;

  /**
   * Optional fallback content if user doesn't have required role
   * If not provided, nothing will be rendered
   */
  fallback?: ReactNode;

  /**
   * If true, user must have ALL roles in the array
   * If false (default), user needs at least ONE role from the array
   */
  requireAll?: boolean;
}

/**
 * Component to conditionally render content based on user's role
 *
 * Usage:
 * ```tsx
 * <RoleGuard allowedRoles="admin">
 *   <AdminPanel />
 * </RoleGuard>
 *
 * <RoleGuard allowedRoles={['admin', 'doctor']} fallback={<p>Access Denied</p>}>
 *   <SensitiveContent />
 * </RoleGuard>
 * ```
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  children,
  fallback = null,
  requireAll = false,
}) => {
  const { userRole } = useAuth();

  if (!userRole) {
    return <>{fallback}</>;
  }

  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  const hasAccess = requireAll
    ? rolesArray.every(role => role === userRole)
    : rolesArray.includes(userRole);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

export default RoleGuard;
