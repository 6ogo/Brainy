import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { SecurityUtils } from '../utils/security';
import type { AuthState, LoginCredentials, SignupCredentials, User } from '../types/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  signup: (credentials: SignupCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });
  const navigate = useNavigate();
  const authChangeHandled = useRef(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        setState(prev => ({
          ...prev,
          error: 'Failed to authenticate',
          isLoading: false,
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        user: session?.user ? convertSupabaseUser(session.user) : null,
        isLoading: false,
      }));

      // Store session securely if it exists
      if (session?.access_token) {
        SecurityUtils.setSecureItem('user_session', session.access_token);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Prevent multiple handlers for the same event
      if (authChangeHandled.current) {
        return;
      }
      
      authChangeHandled.current = true;
      console.log('Auth state changed:', event);
      
      setState(prev => ({
        ...prev,
        user: session?.user ? convertSupabaseUser(session.user) : null,
        isLoading: false,
        error: null,
      }));

      // Handle session storage
      if (session?.access_token) {
        SecurityUtils.setSecureItem('user_session', session.access_token);
      } else {
        SecurityUtils.removeSecureItem('user_session');
      }

      // Handle navigation based on auth events
      if (event === 'SIGNED_OUT') {
        // Clear all secure storage
        SecurityUtils.removeSecureItem('csrf_token');
        navigate('/login');
      } else if (event === 'SIGNED_IN') {
        // User successfully signed in
        console.log('User signed in successfully');
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed');
      }
      
      // Reset the flag after a short delay to allow for future auth changes
      setTimeout(() => {
        authChangeHandled.current = false;
      }, 100);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const login = async ({ email, password }: LoginCredentials) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Validate inputs
      if (!SecurityUtils.validateEmail(email)) {
        throw new Error('Invalid email format');
      }

      if (!SecurityUtils.validateInput(password, 128)) {
        throw new Error('Invalid password format');
      }

      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.toLowerCase().trim(), 
        password 
      });
      
      if (error) {
        console.error('Login error:', error);
        // Don't expose detailed error messages for security
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Please check your email and click the confirmation link');
        } else if (error.message.includes('Too many requests')) {
          throw new Error('Too many login attempts. Please try again later');
        } else {
          throw new Error('Login failed. Please try again');
        }
      }

      if (!data.user) {
        throw new Error('Login failed. Please try again');
      }

      return true;
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during login';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage
      }));
      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const signup = async ({ email, password, full_name }: SignupCredentials) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Validate inputs
      if (!SecurityUtils.validateEmail(email)) {
        throw new Error('Invalid email format');
      }

      const passwordValidation = SecurityUtils.validatePassword(password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors[0]);
      }

      if (!SecurityUtils.validateInput(full_name, 100) || full_name.trim().length < 2) {
        throw new Error('Name must be between 2 and 100 characters');
      }

      // Sanitize inputs
      const sanitizedFullName = SecurityUtils.sanitizeInput(full_name.trim());
      const sanitizedEmail = email.toLowerCase().trim();

      console.log('Attempting signup with:', { email: sanitizedEmail, full_name: sanitizedFullName });

      const { data, error } = await supabase.auth.signUp({ 
        email: sanitizedEmail, 
        password,
        options: {
          data: { 
            full_name: sanitizedFullName 
          }
        }
      });
      
      if (error) {
        console.error('Signup error:', error);
        // Handle specific signup errors
        if (error.message.includes('User already registered')) {
          throw new Error('An account with this email already exists');
        } else if (error.message.includes('Password should be')) {
          throw new Error('Password does not meet security requirements');
        } else if (error.message.includes('Unable to validate email')) {
          throw new Error('Invalid email address');
        } else if (error.message.includes('signup_disabled')) {
          throw new Error('Account registration is temporarily disabled');
        } else {
          throw new Error('Account creation failed. Please try again');
        }
      }

      if (!data.user) {
        throw new Error('Account creation failed. Please try again');
      }

      console.log('Signup successful:', data.user);
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during signup';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage
      }));
      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const logout = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear all secure storage
      SecurityUtils.removeSecureItem('user_session');
      SecurityUtils.removeSecureItem('csrf_token');
      
      // Clear any cached data
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        } catch (error) {
          console.error('Error clearing caches:', error);
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during logout';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Helper function to convert Supabase user to our custom User type
const convertSupabaseUser = (supabaseUser: any): User => {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    created_at: new Date(supabaseUser.created_at),
    updated_at: new Date(supabaseUser.updated_at || supabaseUser.created_at),
    full_name: supabaseUser.user_metadata?.full_name,
    avatar_url: supabaseUser.user_metadata?.avatar_url,
    last_login: supabaseUser.last_sign_in_at ? new Date(supabaseUser.last_sign_in_at) : undefined,
  };
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};