import { createContext, useContext } from 'react';

export const AuthContext = createContext(null);

/**
 * Hook to access current authentication context.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
