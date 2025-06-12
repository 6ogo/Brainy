import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Brain, ArrowLeft, Mail, Shield, CheckCircle } from 'lucide-react';
import { cn, commonStyles } from '../styles/utils';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { supabase } from '../lib/supabase';
import { SecurityUtils } from '../utils/security';
import { useSecurity } from '../components/SecurityProvider';
import { authRateLimiter } from '../utils/rateLimiter';
import toast from 'react-hot-toast';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');
  const navigate = useNavigate();
  const { csrfToken, sanitizeInput, validateInput } = useSecurity();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = sanitizeInput(e.target.value);
    if (validateInput(value, 254)) {
      setEmail(value);
      
      if (value && !SecurityUtils.validateEmail(value)) {
        setEmailError('Please enter a valid email address');
      } else {
        setEmailError('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || emailError) {
      return;
    }

    // Rate limiting check
    if (!authRateLimiter.isAllowed(email)) {
      toast.error('Too many password reset attempts. Please try again later.');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        // Don't reveal whether the email exists or not for security
        console.error('Password reset error:', error);
      }

      // Always show success message for security
      setEmailSent(true);
      toast.success('If an account with that email exists, we\'ve sent a password reset link.');
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
        <Card variant="base" className="w-full max-w-md p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          
          <h1 className={cn(commonStyles.heading.h2, "font-sans mb-4")}>
            Check Your Email
          </h1>
          
          <p className={cn(commonStyles.text.base, "mb-6")}>
            If an account with <strong>{email}</strong> exists, we've sent you a secure link to reset your password.
          </p>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start">
                <Mail className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Didn't receive the email?</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Check your spam/junk folder</li>
                    <li>Make sure you entered the correct email</li>
                    <li>Wait a few minutes for delivery</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <Button
              variant="primary"
              className="w-full"
              onClick={() => navigate('/login')}
            >
              Back to Sign In
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setEmailSent(false);
                setEmail('');
              }}
            >
              Try Different Email
            </Button>
          </div>
        </Card>
      </div>
    );
  }

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
            Reset your password
          </h1>
          <p className={cn(commonStyles.text.base)}>
            Enter your email and we'll send you a secure link to reset your password
          </p>
        </div>

        {/* Security Status */}
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-md flex items-center">
          <Shield className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-sm text-green-700">Secure password reset with time-limited tokens</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="hidden" name="csrf_token" value={csrfToken} />
          
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="Enter your email"
            required
            error={emailError}
            autoComplete="email"
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isLoading}
            disabled={!email || !!emailError}
          >
            Send Reset Link
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <Link
                to="/login"
                className={cn(commonStyles.button.text, "text-sm")}
              >
                Sign In
              </Link>
            </p>
            
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className={cn(commonStyles.button.text, "text-sm")}
              >
                Sign Up
              </Link>
            </p>
          </div>
        </form>

        {/* Security Information */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Reset links expire after 1 hour for your security.
            <br />
            Links can only be used once and are tied to your account.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPassword;