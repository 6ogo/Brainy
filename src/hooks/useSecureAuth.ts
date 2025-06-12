import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SecurityUtils } from '../utils/security';
import { authRateLimiter } from '../utils/rateLimiter';
import toast from 'react-hot-toast';

interface LoginAttempt {
  email: string;
  timestamp: number;
  success: boolean;
}

export const useSecureAuth = () => {
  const { user, login, signup, logout, isLoading, error } = useAuth();
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);

  // Check for account lockout
  useEffect(() => {
    const checkLockout = () => {
      if (lockoutEndTime && Date.now() < lockoutEndTime) {
        setIsLocked(true);
      } else {
        setIsLocked(false);
        setLockoutEndTime(null);
      }
    };

    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, [lockoutEndTime]);

  const secureLogin = async (email: string, password: string): Promise<boolean> => {
    // Rate limiting check
    if (!authRateLimiter.isAllowed(email)) {
      toast.error('Too many login attempts. Please try again later.');
      return false;
    }

    // Account lockout check
    if (isLocked) {
      const remainingTime = Math.ceil((lockoutEndTime! - Date.now()) / 1000 / 60);
      toast.error(`Account temporarily locked. Try again in ${remainingTime} minutes.`);
      return false;
    }

    // Input validation
    if (!SecurityUtils.validateEmail(email)) {
      toast.error('Please enter a valid email address.');
      return false;
    }

    if (!SecurityUtils.validateInput(password, 128)) {
      toast.error('Invalid password format.');
      return false;
    }

    try {
      const success = await login({ email, password });
      
      const attempt: LoginAttempt = {
        email,
        timestamp: Date.now(),
        success
      };

      setLoginAttempts(prev => [...prev.slice(-4), attempt]);

      if (!success) {
        // Check for multiple failed attempts
        const recentFailures = loginAttempts
          .filter(attempt => 
            attempt.email === email && 
            !attempt.success && 
            Date.now() - attempt.timestamp < 15 * 60 * 1000 // 15 minutes
          );

        if (recentFailures.length >= 4) {
          const lockoutDuration = 30 * 60 * 1000; // 30 minutes
          setLockoutEndTime(Date.now() + lockoutDuration);
          setIsLocked(true);
          toast.error('Account locked due to multiple failed login attempts. Try again in 30 minutes.');
        } else {
          toast.error('Invalid email or password.');
        }
      } else {
        // Clear failed attempts on successful login
        setLoginAttempts(prev => prev.filter(attempt => attempt.email !== email || attempt.success));
        toast.success('Login successful!');
      }

      return success;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred during login. Please try again.');
      return false;
    }
  };

  const secureSignup = async (email: string, password: string, fullName: string): Promise<boolean> => {
    // Rate limiting check
    if (!authRateLimiter.isAllowed(email)) {
      toast.error('Too many signup attempts. Please try again later.');
      return false;
    }

    // Input validation
    if (!SecurityUtils.validateEmail(email)) {
      toast.error('Please enter a valid email address.');
      return false;
    }

    const passwordValidation = SecurityUtils.validatePassword(password);
    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.errors[0]);
      return false;
    }

    if (!SecurityUtils.validateInput(fullName, 100)) {
      toast.error('Please enter a valid name (max 100 characters).');
      return false;
    }

    // Sanitize inputs
    const sanitizedFullName = SecurityUtils.sanitizeInput(fullName);

    try {
      const success = await signup({ 
        email, 
        password, 
        full_name: sanitizedFullName 
      });

      if (success) {
        toast.success('Account created successfully!');
      }

      return success;
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('An error occurred during signup. Please try again.');
      return false;
    }
  };

  const secureLogout = async (): Promise<void> => {
    try {
      await logout();
      
      // Clear sensitive data from storage
      SecurityUtils.removeSecureItem('user_session');
      SecurityUtils.removeSecureItem('csrf_token');
      
      // Clear any cached data
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('An error occurred during logout');
    }
  };

  return {
    user,
    isLoading,
    error,
    isLocked,
    lockoutEndTime,
    secureLogin,
    secureSignup,
    secureLogout,
    remainingAttempts: authRateLimiter.getRemainingRequests(user?.email || 'anonymous')
  };
};