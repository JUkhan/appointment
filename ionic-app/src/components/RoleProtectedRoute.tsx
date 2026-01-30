import React, { ReactNode } from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { IonSpinner, IonContent } from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface RoleProtectedRouteProps extends RouteProps {
  /**
   * Required role(s) to access this route
   */
  allowedRoles: UserRole | UserRole[];

  /**
   * Redirect path if user doesn't have required role
   * Defaults to '/login' if not authenticated, or '/' if authenticated but wrong role
   */
  redirectTo?: string;

  /**
   * Component to render if user has access
   */
  component?: React.ComponentType<any>;

  /**
   * Children to render if user has access
   */
  children?: ReactNode;
}

/**
 * Route component that requires specific role(s) to access
 * Redirects to login if not authenticated
 * Redirects to specified path if authenticated but wrong role
 *
 * Usage:
 * ```tsx
 * <RoleProtectedRoute
 *   path="/admin"
 *   allowedRoles="admin"
 *   component={AdminDashboard}
 * />
 *
 * <RoleProtectedRoute
 *   path="/medical-records"
 *   allowedRoles={['admin', 'doctor']}
 *   component={MedicalRecords}
 *   redirectTo="/unauthorized"
 * />
 * ```
 */
export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  allowedRoles,
  redirectTo,
  component: Component,
  children,
  ...rest
}) => {
  const { isAuthenticated, isLoading, userRole } = useAuth();

  // Show loading spinner while checking auth status
  if (isLoading) {
    return (
      <IonContent className="ion-padding">
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
          }}
        >
          <IonSpinner name="crescent" />
        </div>
      </IonContent>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  // Check if user has required role
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const hasRequiredRole = userRole && rolesArray.includes(userRole);

  if (!hasRequiredRole) {
    // Authenticated but wrong role - redirect
    const fallbackPath = redirectTo || '/';
    return <Redirect to={fallbackPath} />;
  }

  // User has required role - render the route
  return (
    <Route
      {...rest}
      render={(props) => {
        if (Component) {
          return <Component {...props} />;
        }
        return <>{children}</>;
      }}
    />
  );
};

export default RoleProtectedRoute;
