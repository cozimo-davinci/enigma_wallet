import React, { createContext, useContext } from 'react';

interface AuthContextType {
  setAuthState: (isAuthenticated: boolean, isWalletCreated: boolean | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;