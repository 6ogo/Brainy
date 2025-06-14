import React from 'react';
import { Brain, User, BarChart3, LogOut, CreditCard } from 'lucide-react';
import { SubjectSelector } from './SubjectSelector';
import { cn, commonStyles } from '../styles/utils';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './Button';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className={cn(commonStyles.container, "py-4")}>
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-3">
            <div className="rounded-full bg-primary-600 p-2">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="font-semibold text-xl text-primary-900 font-sans">Brainbud</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <SubjectSelector />
                
                <Link to="/analytics" className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100">
                  <BarChart3 className="h-5 w-5 text-primary-600" />
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline">Analytics</span>
                </Link>

                <Link to="/pricing" className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100">
                  <CreditCard className="h-5 w-5 text-primary-600" />
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline">Upgrade</span>
                </Link>
                
                <div className="relative group">
                  {/* Larger hover trigger area */}
                  <div className="flex items-center space-x-2 cursor-pointer px-3 py-2 rounded-md hover:bg-gray-100 transition-colors">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                      {user.full_name || 'Student'}
                    </span>
                  </div>
                  
                  {/* Dropdown with extended hover area */}
                  <div className="absolute right-0 top-full pt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    {/* Invisible bridge to prevent gap */}
                    <div className="absolute -top-2 left-0 right-0 h-4"></div>
                    
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                      <div className="py-2">
                        {/* User info section */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-primary-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {user.full_name || 'Student'}
                              </p>
                              <p className="text-xs text-gray-500 truncate max-w-[150px]">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Menu items */}
                        <div className="py-1">
                          <Link 
                            to="/pricing"
                            className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <CreditCard className="h-4 w-4 mr-3 text-gray-400" />
                            Manage Subscription
                          </Link>
                          
                          <Link 
                            to="/analytics"
                            className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <BarChart3 className="h-4 w-4 mr-3 text-gray-400" />
                            View Analytics
                          </Link>
                          
                          <div className="border-t border-gray-100 my-1"></div>
                          
                          <button 
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <LogOut className="h-4 w-4 mr-3 text-gray-400" />
                            Sign out
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : !isAuthPage && (
              <Button
                variant="primary"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}