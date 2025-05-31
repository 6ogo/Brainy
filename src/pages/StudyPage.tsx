import React from 'react';
import { cn, commonStyles } from '../styles/utils';

export const StudyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-primary-950 text-white p-8">
      <h1 className={cn(
        commonStyles.heading.h1,
        "font-light mb-6 bg-gradient-to-r from-primary-400 to-secondary-400 text-transparent bg-clip-text"
      )}>
        Study Page
      </h1>
      <p className={cn(commonStyles.text.base, "text-gray-400")}>
        Your study session content will appear here.
      </p>
    </div>
  );
};