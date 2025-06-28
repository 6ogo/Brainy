import React, { useState } from 'react';
import { useStore } from '../store/store';
import { BookOpen, Zap, Info } from 'lucide-react';
import { cn } from '../styles/utils';
import toast from 'react-hot-toast';
import { StudyModeContent } from './StudyModeContent';

export const StudyModeToggle: React.FC = () => {
  const { isStudyMode, setStudyMode, currentSubject } = useStore();
  const [showInfo, setShowInfo] = useState(false);

  const handleToggleStudyMode = () => {
    setStudyMode(!isStudyMode);
    
    if (!isStudyMode) {
      toast.success('Study Mode activated. You\'ll now receive deeper educational insights.', {
        icon: '📚',
        duration: 3000,
      });
    } else {
      toast.success('Regular Mode activated. Full interactive experience restored.', {
        icon: '✨',
        duration: 3000,
      });
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggleStudyMode}
        className={cn(
          "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
          isStudyMode
            ? "bg-amber-100 text-amber-700 border border-amber-300"
            : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
        )}
        title={isStudyMode ? "Switch to Regular Mode" : "Switch to Study Mode"}
        aria-pressed={isStudyMode}
      >
        {isStudyMode ? (
          <>
            <BookOpen className="h-4 w-4" />
            <span>Study Mode</span>
          </>
        ) : (
          <>
            <Zap className="h-4 w-4" />
            <span>Regular Mode</span>
          </>
        )}
      </button>
      
      <button
        onClick={() => setShowInfo(!showInfo)}
        className="ml-2 p-1 rounded-full hover:bg-gray-100 text-gray-500"
        aria-label="More information"
      >
        <Info className="h-4 w-4" />
      </button>
      
      {showInfo && (
        <div className="absolute top-full mt-2 right-0 z-10 w-80 shadow-lg">
          <StudyModeContent subject={currentSubject} />
        </div>
      )}
    </div>
  );
};