import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Brain, ArrowLeft, Shield, CheckCircle, AlertTriangle, Lock } from 'lucide-react';
import { cn, commonStyles } from '../styles/utils';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { supabase } from '../lib/supabase';
import { SecurityUtils } from '../utils/security';
import { useSecurity } from '../components/SecurityProvider';
import toast from 'react-hot-toast';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { csrfToken, sanitizeInput, validateInput } = useSecurity();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({ isValid: false, errors: [] as string[] });
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [resetComplete, setResetComplete] = useState(false);

  // Extract token and type from URL parameters
  const token = searchParams.get('token');
  const type = searchParams.get('type');
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');

  // Validate password in real-time
  useEffect(() => {
    if (password) {
      setPasswordValidation(SecurityUtils.validatePassword(password));
    } else {
      setPasswordValidation({ isValid: false, errors: [] });
    }
  }, [password]);

  // Validate confirm password
  useEffect(() => {
    if (confirmPassword && password) {
      if (confirmPassword !== password) {
        setConfirmPasswordError('Passwords do not match');
      } else {
        setConfirmPasswordError('');
      }
    } else {
      setConfirmPasswordError('');
    }
  }, [password, confirmPassword]);

  // Validate the reset token on component mount
  useEffect(() => {
    const validateToken = async () => {
      try {
        setIsValidating(true);

        // Check if we have the required parameters
        if (!token || type !== 'recovery') {
          throw new Error('Invalid or missing reset token');
        }

        // If we have access_token and refresh_token, set the session
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            throw new Error('Invalid or expired reset link');
          }

          setIsValidToken(true);
        } else {
          // Verify the token with Supabase
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'recovery'
          });

          if (error) {
            throw new Error('Invalid or expired reset link');
          }

          if (data.session) {
            setIsValidToken(true);
          } else {
            throw new Error('Unable to verify reset token');
          }
        }
      } catch (error) {
        console.error('Token validation error:', error);
        setIsValidToken(false);
        toast.error(error instanceof Error ? error.message : 'Invalid reset link');
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token, type, accessToken, refreshToken]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (validateInput(value, 128)) {
      setPassword(value);
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (validateInput(value, 128)) {
      setConfirmPassword(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword || !passwordValidation.isValid || confirmPasswordError) {
      return;
    }

    setIsLoading(true);

    try {
      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      setResetComplete(true);
      toast.success('Password updated successfully!');
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Password updated successfully. Please sign in with your new password.' }
        });
      }, 3000);

    } catch (error) {
      console.error('Password reset error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('session_not_found')) {
          toast.error('Reset session expired. Please request a new password reset.');
          navigate('/forgot-password');
        } else if (error.message.includes('same_password')) {
          toast.error('New password must be different from your current password.');
        } else {
          toast.error(error.message || 'Failed to update password. Please try again.');
        }
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    const score = passwordValidation.errors.length;
    if (score === 0) return 'text-green-600';
    if (score <= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPasswordStrengthText = () => {
    const score = passwordValidation.errors.length;
    if (score === 0) return 'Strong';
    if (score <= 2) return 'Medium';
    return 'Weak';
  };

  // Loading state while validating token
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
        <Card variant="base" className="w-full max-w-md p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
          <h1 className={cn(commonStyles.heading.h2, "font-sans mb-2")}>
            Validating Reset Link
          </h1>
          <p className={cn(commonStyles.text.base)}>
            Please wait while we verify your password reset link...
          </p>
        </Card>
      </div>
    );
  }

  // Invalid token state
  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
        <Card variant="base" className="w-full max-w-md p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-red-100 p-4">
              <AlertTriangle className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <h1 className={cn(commonStyles.heading.h2, "font-sans mb-4")}>
            Invalid Reset Link
          </h1>
          <p className={cn(commonStyles.text.base, "mb-6")}>
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <div className="space-y-4">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => navigate('/forgot-password')}
            >
              Request New Reset Link
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/login')}
            >
              Back to Sign In
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Success state
  if (resetComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
        <Card variant="base" className="w-full max-w-md p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h1 className={cn(commonStyles.heading.h2, "font-sans mb-4")}>
            Password Updated!
          </h1>
          <p className={cn(commonStyles.text.base, "mb-6")}>
            Your password has been successfully updated. You will be redirected to the sign-in page shortly.
          </p>
          <Button
            variant="primary"
            className="w-full"
            onClick={() => navigate('/login')}
          >
            Continue to Sign In
          </Button>
        </Card>
      </div>
    );
  }

  const isFormValid = password && confirmPassword && passwordValidation.isValid && !confirmPasswordError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <Card variant="base" className="w-full max-w-md p-8 relative">
        <Button
          variant="text"
          onClick={() => navigate('/login')}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          className="absolute top-4 left-4"
        >
          Back to Sign In
        </Button>

        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-primary-600 p-4">
              <Lock className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className={cn(commonStyles.heading.h2, "font-sans mb-2")}>
            Set New Password
          </h1>
          <p className={cn(commonStyles.text.base)}>
            Choose a strong password for your Brainbud account
          </p>
        </div>

        {/* Security Status */}
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-md flex items-center">
          <Shield className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-sm text-green-700">Secure password reset with verified token</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="hidden" name="csrf_token" value={csrfToken} />
          
          {/* New Password */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="new-password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter your new password"
                required
                autoComplete="new-password"
                className="block w-full pr-12 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {password && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">Password strength:</span>
                  <span className={cn("text-xs font-medium", getPasswordStrengthColor())}>
                    {getPasswordStrengthText()}
                  </span>
                </div>
                
                {/* Password Requirements */}
                <div className="space-y-1">
                  {[
                    { test: password.length >= 8, text: 'At least 8 characters' },
                    { test: /[a-z]/.test(password), text: 'One lowercase letter' },
                    { test: /[A-Z]/.test(password), text: 'One uppercase letter' },
                    { test: /\d/.test(password), text: 'One number' },
                    { test: /[!@#$%^&*(),.?":{}|<>]/.test(password), text: 'One special character' },
                  ].map((requirement, index) => (
                    <div key={index} className="flex items-center text-xs">
                      {requirement.test ? (
                        <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                      ) : (
                        <div className="h-3 w-3 border border-gray-300 rounded-full mr-2"></div>
                      )}
                      <span className={requirement.test ? 'text-green-600' : 'text-gray-500'}>
                        {requirement.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirm-password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                placeholder="Confirm your new password"
                required
                autoComplete="new-password"
                className={cn(
                  "block w-full pr-12 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-300",
                  confirmPasswordError ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {confirmPasswordError && (
              <p className="mt-1 text-sm text-red-600">{confirmPasswordError}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isLoading}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? 'Updating Password...' : 'Update Password'}
          </Button>
        </form>

        {/* Security Information */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Your password is encrypted and stored securely.
            <br />
            This reset link can only be used once and will expire after use.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ResetPassword;