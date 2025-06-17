import React from 'react';
import { useStore } from '../store/store';
import { BookOpen, Zap } from 'lucide-react';
import { cn } from '../styles/utils';
import toast from 'react-hot-toast';

export const StudyModeToggle: React.FC = () => {
  const { isStudyMode, setStudyMode } = useStore();

  const handleToggleStudyMode = () => {
    setStudyMode(!isStudyMode);
    
    if (!isStudyMode) {
      toast.success('Study Mode activated. Responses will be concise and focused.');
    } else {
      toast.success('Regular Mode activated. Full interactive experience restored.');
    }
  };

  return (
    <button
      onClick={handleToggleStudyMode}
      className={cn(
        "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        isStudyMode
          ? "bg-amber-100 text-amber-700 border border-amber-300"
          : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
      )}
      title={isStudyMode ? "Switch to Regular Mode" : "Switch to Study Mode"}
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
  );
};