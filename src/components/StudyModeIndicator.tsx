import React from 'react';
import { useStore } from '../store/store';
import { BookOpen, Zap } from 'lucide-react';
import { cn } from '../styles/utils';

interface StudyModeIndicatorProps {
  className?: string;
}

export const StudyModeIndicator: React.FC<StudyModeIndicatorProps> = ({ className }) => {
  const { isStudyMode } = useStore();

  if (!isStudyMode) return null;

  return (
    <div className={cn(
      "flex items-center space-x-2 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-200",
      className
    )}>
      <BookOpen className="h-3.5 w-3.5" />
      <span>Study Mode</span>
    </div>
  );
};