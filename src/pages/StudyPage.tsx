import React from 'react';

export const StudyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-light mb-6 bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
        Study Page
      </h1>
      <p className="text-gray-400">
        Your study session content will appear here.
      </p>
    </div>
  );
};