import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(prev => ({
        ...prev,
        user: session?.user ? convertSupabaseUser(session.user) : null,
        isLoading: false,
      }));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setState(prev => ({
        ...prev,
        user: session?.user ? convertSupabaseUser(session.user) : null,
        isLoading: false,
      }));
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async ({ email, password }: LoginCredentials) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      navigate('/onboarding');
      return true;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'An error occurred' 
      }));
      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const signup = async ({ email, password, full_name }: SignupCredentials) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: { full_name }
        }
      });
      
      if (error) throw error;
      navigate('/onboarding');
      return true;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'An error occurred' 
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
      navigate('/login');
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'An error occurred' 
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