import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Brain, ArrowLeft, Shield, Check, X } from 'lucide-react';
import { cn, commonStyles } from '../styles/utils';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import { useSecurity } from '../components/SecurityProvider';
import { SecurityUtils } from '../utils/security';

export const SignUp: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [emailError, setEmailError] = useState('');
  const [nameError, setNameError] = useState('');
  const [passwordValidation, setPasswordValidation] = useState({ isValid: false, errors: [] as string[] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  const { signup, isLoading, error } = useAuth();
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
    if (fullName && (!validateInput(fullName, 100) || fullName.trim().length < 2)) {
      setNameError('Name must be between 2 and 100 characters');
    } else {
      setNameError('');
    }
  }, [fullName, validateInput]);

  useEffect(() => {
    if (password) {
      setPasswordValidation(SecurityUtils.validatePassword(password));
    } else {
      setPasswordValidation({ isValid: false, errors: [] });
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

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = sanitizeInput(e.target.value);
    if (validateInput(value, 100)) {
      setFullName(value);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !fullName || !acceptedTerms || 
        emailError || nameError || !passwordValidation.isValid) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const success = await signup({ 
        email: email.trim().toLowerCase(), 
        password, 
        full_name: fullName.trim() 
      });
      
      if (success) {
        navigate('/onboarding');
      }
    } catch (signupError) {
      console.error('Signup error:', signupError);
      // Error is already handled by the auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = email && password && fullName && acceptedTerms && 
                     !emailError && !nameError && passwordValidation.isValid;

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
            Create your account
          </h1>
          <p className={cn(commonStyles.text.base)}>
            Join Brainbud and start your learning journey
          </p>
        </div>

        {/* Security Status */}
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-md flex items-center">
          <Shield className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-sm text-green-700">Account creation protected by advanced security</span>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-error-50 border border-error-200 text-error-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-6">
          <input type="hidden" name="csrf_token" value={csrfToken} />
          
          <Input
            id="fullname"
            label="Full Name"
            type="text"
            name="fullname"
            value={fullName}
            onChange={handleNameChange}
            placeholder="Enter your full name"
            required
            error={nameError}
            autoComplete="name"
          />

          <Input
            id="email"
            label="Email"
            type="email"
            name="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="Enter your email"
            required
            error={emailError}
            autoComplete="email"
          />

          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="new-password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Create a password"
                required
                autoComplete="new-password"
                className="block w-full pr-12 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
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
                        <Check className="h-3 w-3 text-green-500 mr-2" />
                      ) : (
                        <X className="h-3 w-3 text-gray-400 mr-2" />
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

          {/* Terms and Conditions */}
          <div className="flex items-start">
            <input
              type="checkbox"
              id="terms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              required
            />
            <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
              I agree to the{' '}
              <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                Privacy Policy
              </Link>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isLoading || isSubmitting}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </Button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className={cn(commonStyles.button.text, "text-sm")}
            >
              Sign In
            </Link>
          </p>
        </form>

        {/* Security Information */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Your data is protected with enterprise-grade security.
            <br />
            We comply with GDPR, CCPA, and other privacy regulations.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default SignUp;