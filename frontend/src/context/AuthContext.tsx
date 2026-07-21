import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CompanyProfile } from '../service/authService';
import { authService } from '../service/authService';
import { setAccessToken } from '../service/api';

interface AuthContextType {
  company: CompanyProfile | null;
  loading: boolean;
  login: (token: string, company: CompanyProfile) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const login = (token: string, companyData: CompanyProfile) => {
    setAccessToken(token);
    setCompany(companyData);
  };

  const logout = () => {
    setAccessToken(null);
    setCompany(null);
    // Call the logout endpoint in background to clear refresh token cookies
    authService.logout().catch((err) => console.error('Failed to log out of server:', err));
  };

  const refreshProfile = async () => {
    try {
      const response = await authService.getProfile();
      if (response.success && response.data) {
        setCompany(response.data);
      } else {
        setAccessToken(null);
        setCompany(null);
      }
    } catch (err) {
      console.error('Failed to refresh profile:', err);
      setAccessToken(null);
      setCompany(null);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      await refreshProfile();
      setLoading(false);
    };

    initializeAuth();

    // Listen for custom API logout events (e.g. from axios interceptor on 401 expiry)
    const handleLogoutEvent = () => {
      setAccessToken(null);
      setCompany(null);
    };
    window.addEventListener('auth-logout', handleLogoutEvent);

    return () => {
      window.removeEventListener('auth-logout', handleLogoutEvent);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ company, loading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
