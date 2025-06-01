import React from 'react';
import { Brain, User } from 'lucide-react';
import { SubjectSelector } from './SubjectSelector';
import { cn, commonStyles } from '../styles/utils';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className={cn(commonStyles.container, "py-4")}>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="rounded-full bg-primary-600 p-2">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="font-semibold text-xl text-primary-900 font-sans">Brainy</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <SubjectSelector />
            
            <div className="flex items-center space-x-2 cursor-pointer">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-primary-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">Student</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}