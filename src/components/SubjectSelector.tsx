import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useStore } from '../store/store';
import { Subject } from '../types';
import { cn, commonStyles } from '../styles/utils';

export const SubjectSelector: React.FC = () => {
  const { currentSubject, setCurrentSubject } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  const subjects: Subject[] = ['Math', 'Science', 'English', 'History', 'Languages', 'Test Prep'];

  return (
    <div className="relative">
      <button
        type="button"
        className={cn(
          commonStyles.button.outline,
          "inline-flex items-center px-3 py-2 text-sm leading-4 font-medium",
          "text-gray-700 hover:bg-gray-50 focus:ring-primary-500"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {currentSubject}
        <ChevronDown className="ml-2 h-4 w-4" />
      </button>

      {isOpen && (
        <div className={cn(
          commonStyles.card.base,
          "origin-top-right absolute right-0 mt-2 w-48 z-10"
        )}>
          <div 
            className="py-1"
            role="menu" 
            aria-orientation="vertical"
          >
            {subjects.map((subject) => (
              <button
                key={subject}
                className={cn(
                  "w-full text-left px-4 py-2 text-sm hover:bg-gray-100",
                  currentSubject === subject ? "bg-primary-50 text-primary-700 font-medium" : "text-gray-700"
                )}
                onClick={() => {
                  setCurrentSubject(subject);
                  setIsOpen(false);
                }}
              >
                {subject}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};