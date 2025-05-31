import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { cn, commonStyles } from '../styles/utils';

export const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Add login logic here
    navigate('/study');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 bg-primary-950">
        <div className="max-w-md w-full mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-light mb-6 bg-gradient-to-r from-primary-400 to-secondary-400 text-transparent bg-clip-text font-sans">
              Welcome back!
            </h1>
            <p className="text-gray-400">
              Sign in to access your personalized AI tutor and continue your learning journey
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="text-sm text-gray-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-400">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-primary-500 transition-colors font-sans"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-700 text-primary-500 focus:ring-primary-500 focus:ring-offset-gray-900"
                />
                <span className="text-sm text-gray-400">Remember me</span>
              </label>
              <button type="button" className="text-sm text-primary-400 hover:text-primary-300">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className={cn(
                commonStyles.button.primary,
                "w-full py-3 px-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg",
                "hover:from-primary-600 hover:to-secondary-600 focus:ring-primary-500 focus:ring-offset-gray-900"
              )}
            >
              Log In
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-900 text-gray-400">Or</span>
              </div>
            </div>

            <button
              type="button"
              className="w-full py-3 px-4 flex items-center justify-center space-x-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <img src="/google.svg" alt="Google" className="w-5 h-5" />
              <span className="text-white">Sign in with Google</span>
            </button>

            <p className="text-center text-gray-400 text-sm">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="text-primary-400 hover:text-primary-300"
              >
                Sign Up
              </button>
            </p>
          </form>
        </div>
      </div>

      {/* Right side - Image and testimonials */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 to-secondary-900">
          <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/3769714/pexels-photo-3769714.jpeg')] bg-cover bg-center mix-blend-overlay"></div>
        </div>
        <div className="absolute inset-0 flex flex-col justify-between p-12">
          <div className="flex justify-end">
            <button className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg text-white hover:bg-white/20 transition-colors">
              <span>Join Discord</span>
              <img src="/discord.svg" alt="Discord" className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-medium">{testimonial.name}</p>
                    <p className="text-sm text-gray-300">{testimonial.handle}</p>
                  </div>
                </div>
                <p className="text-sm">{testimonial.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const testimonials = [
  {
    name: "Sarah Chen",
    handle: "@studywithsarah",
    avatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg",
    text: "Brainly transformed my learning experience. The AI tutor adapts perfectly to my pace and explains complex topics in ways I can understand."
  },
  {
    name: "James Wilson",
    handle: "@jameswlearns",
    avatar: "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg",
    text: "As a working professional studying for certifications, Brainly helps me make the most of my limited study time. It's like having a personal tutor available 24/7."
  },
  {
    name: "Maria Garcia",
    handle: "@mariastudies",
    avatar: "https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg",
    text: "The interactive learning experience with the AI tutor keeps me engaged. I've improved my grades significantly since using Brainly."
  },
  {
    name: "Alex Thompson",
    handle: "@alexthinks",
    avatar: "https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg",
    text: "Finally found an AI tutor that understands my learning style. The personalized approach and instant feedback make learning enjoyable."
  }
];