import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Brain, ArrowLeft, Shield, AlertTriangle } from 'lucide-react';
import { cn, commonStyles } from '../styles/utils';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { useSecureAuth } from '../hooks/useSecureAuth';
import { useSecurity } from '../components/SecurityProvider';
import { SecurityUtils } from '../utils/security';

export const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { secureLogin, isLoading, error, isLocked, lockoutEndTime, remainingAttempts } = useSecureAuth();
  const { csrfToken, sanitizeInput, validateInput } = useSecurity();
  const navigate = useNavigate();

  // Real-time validation
  useEffect(() => {
    if (email && !SecurityUtils.validateEmail(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  }, [email]);

  useEffect(() => {
    if (password && password.length > 0 && password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
    } else {
      setPasswordError('');
    }
  }, [password]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = sanitizeInput(e.target.value);
    if (validateInput(value, 254)) {
      setEmail(value);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (validateInput(value, 128)) {
      setPassword(value);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      return;
    }

    if (!email || !password || emailError || passwordError) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const success = await secureLogin(email, password);
      if (success) {
        navigate('/onboarding');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLockoutMessage = () => {
    if (!isLocked || !lockoutEndTime) return '';
    
    const remainingTime = Math.ceil((lockoutEndTime - Date.now()) / 1000 / 60);
    return `Account temporarily locked. Try again in ${remainingTime} minutes.`;
  };

  const isFormValid = email && password && !emailError && !passwordError && !isLocked;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <Card variant="base" className="w-full max-w-md p-8 relative">
        <Button
          variant="text"
          onClick={() => navigate('/')}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          className="absolute top-4 left-4"
        >
          Back to Home
        </Button>

        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-primary-600 p-4">
              <Brain className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className={cn(commonStyles.heading.h2, "font-sans mb-2")}>
            Welcome to Brainbud
          </h1>
          <p className={cn(commonStyles.text.base)}>
            Sign in to continue your learning journey
          </p>
        </div>

        {/* Security Status */}
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-md flex items-center">
          <Shield className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-sm text-green-700">Secure login protected by advanced security measures</span>
        </div>

        {/* Rate Limiting Warning */}
        {remainingAttempts <= 2 && remainingAttempts > 0 && (
          <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-sm text-yellow-700">
              {remainingAttempts} login attempt{remainingAttempts !== 1 ? 's' : ''} remaining
            </span>
          </div>
        )}

        {/* Account Lockout Warning */}
        {isLocked && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-sm text-red-700">{getLockoutMessage()}</span>
          </div>
        )}

        {/* General Error */}
        {error && !isLocked && (
          <div className="mb-6 p-3 bg-error-50 border border-error-200 text-error-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <input type="hidden" name="csrf_token" value={csrfToken} />
          
          <Input
            label="Email"
            type="email"
            name="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="Enter your email"
            required
            disabled={isLocked}
            error={emailError}
            autoComplete="email"
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="current-password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter your password"
                required
                disabled={isLocked}
                autoComplete="current-password"
                className={cn(
                  "block w-full pr-12 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-300",
                  passwordError ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isLocked}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {passwordError && (
              <p className="mt-1 text-sm text-red-600">{passwordError}</p>
            )}
            <div className="flex items-center justify-between mt-2">
              <Link
                to="/forgot-password"
                className={cn(commonStyles.button.text, "text-sm")}
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isLoading || isSubmitting}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </Button>

          <p className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className={cn(commonStyles.button.text, "text-sm")}
            >
              Sign Up
            </Link>
          </p>
        </form>

        {/* Security Information */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Your connection is secured with 256-bit SSL encryption.
            <br />
            We never store your password in plain text.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Login;