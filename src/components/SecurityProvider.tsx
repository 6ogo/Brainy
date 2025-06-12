import React, { createContext, useContext, useEffect, useState } from 'react';
import { SecurityUtils } from '../utils/security';

interface SecurityContextType {
  csrfToken: string;
  refreshCSRFToken: () => void;
  sanitizeInput: (input: string) => string;
  validateInput: (input: string, maxLength?: number) => boolean;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [csrfToken, setCSRFToken] = useState<string>('');

  const refreshCSRFToken = () => {
    const newToken = SecurityUtils.generateCSRFToken();
    setCSRFToken(newToken);
    SecurityUtils.setSecureItem('csrf_token', newToken);
  };

  useEffect(() => {
    // Initialize CSRF token
    refreshCSRFToken();

    // Set up CSP
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = SecurityUtils.getCSPHeader();
    document.head.appendChild(meta);

    // Set secure cookie attributes
    document.cookie = 'SameSite=Strict; Secure';

    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  const value: SecurityContextType = {
    csrfToken,
    refreshCSRFToken,
    sanitizeInput: SecurityUtils.sanitizeInput,
    validateInput: SecurityUtils.validateInput,
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};