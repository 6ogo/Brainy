import React from 'react';
import { Brain, User, BarChart3, LogOut } from 'lucide-react';
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
                
                <Link to="/analytics\" className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100">
                  <BarChart3 className="h-5 w-5 text-primary-600" />
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline">Analytics</span>
                </Link>
                
                <div className="relative group">
                  <div className="flex items-center space-x-2 cursor-pointer">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                      {user.full_name || 'Student'}
                    </span>
                  </div>
                  
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-20 hidden group-hover:block">
                    <div className="py-2">
                      <button 
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="h-4 w-4 mr-3 text-gray-400" />
                        Sign out
                      </button>
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