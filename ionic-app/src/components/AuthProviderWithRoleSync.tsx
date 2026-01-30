import React, { ReactNode, useEffect } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { setRoleChangeNotifier } from '../services/apiService';

interface AuthProviderWithRoleSyncProps {
  children: ReactNode;
}

/**
 * Internal component to sync role changes from apiService to AuthContext
 */
const RoleSyncSetup: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { refreshRole } = useAuth();

  useEffect(() => {
    // Set up the role change notifier in apiService
    // This will be called when token is refreshed and role has changed
    setRoleChangeNotifier(() => {
      refreshRole();
    });

    // Cleanup on unmount
    return () => {
      setRoleChangeNotifier(null);
    };
  }, [refreshRole]);

  return <>{children}</>;
};

/**
 * Enhanced AuthProvider that automatically syncs role changes
 * between apiService (token refresh) and AuthContext
 *
 * Usage: Replace <AuthProvider> with <AuthProviderWithRoleSync> in App.tsx
 */
export const AuthProviderWithRoleSync: React.FC<AuthProviderWithRoleSyncProps> = ({ children }) => {
  return (
    <AuthProvider>
      <RoleSyncSetup>{children}</RoleSyncSetup>
    </AuthProvider>
  );
};

export default AuthProviderWithRoleSync;
