import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Brain, ArrowLeft } from 'lucide-react';
import { cn, commonStyles } from '../styles/utils';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ email, password });
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
            Welcome to Brainbud
          </h1>
          <p className={cn(commonStyles.text.base)}>
            Sign in to continue your learning journey
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-error-50 border border-error-200 text-error-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />

          <div className="space-y-1">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              }
            />
            <div className="flex items-center justify-between">
              <button
                type="button"
                className={cn(commonStyles.button.text, "text-sm")}
                onClick={() => navigate('/forgot-password')}
              >
                Forgot password?
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isLoading}
          >
            Sign In
          </Button>

          <p className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className={cn(commonStyles.button.text, "text-sm")}
            >
              Sign Up
            </button>
          </p>
        </form>
      </Card>
    </div>
  );
};

export default Login;