import React from 'react';
import { useStore } from '../store/store';
import { BookOpen, Zap, Info } from 'lucide-react';
import { cn } from '../styles/utils';
import toast from 'react-hot-toast';

export const StudyModeToggle: React.FC = () => {
  const { isStudyMode, setStudyMode } = useStore();

  const handleToggleStudyMode = () => {
    setStudyMode(!isStudyMode);
    
    if (!isStudyMode) {
      toast.success('Study Mode activated. Responses will be concise and focused.', {
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
      
      {isStudyMode && (
        <div className="absolute top-full mt-2 right-0 z-10 w-64 p-3 bg-amber-50 border border-amber-200 rounded-md shadow-md">
          <div className="flex items-start">
            <Info className="h-4 w-4 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              Study Mode provides concise responses focused on essential information to optimize your learning efficiency.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};