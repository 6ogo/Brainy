import React from 'react';
import { Mic, Volume2, Pause } from 'lucide-react';
import { cn } from '../styles/utils';

interface VoiceStatusIndicatorProps {
  isListening: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  className?: string;
}

export const VoiceStatusIndicator: React.FC<VoiceStatusIndicatorProps> = ({
  isListening,
  isSpeaking,
  isPaused,
  className
}) => {
  if (isPaused) {
    return (
      <div className={cn(
        "flex items-center space-x-2 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-200",
        className
      )}>
        <Pause className="h-3.5 w-3.5" />
        <span>Paused</span>
      </div>
    );
  }
  
  if (isListening) {
    return (
      <div className={cn(
        "flex items-center space-x-2 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200",
        className
      )}>
        <Mic className="h-3.5 w-3.5" />
        <span>Listening</span>
        <div className="flex space-x-1">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    );
  }
  
  if (isSpeaking) {
    return (
      <div className={cn(
        "flex items-center space-x-2 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200",
        className
      )}>
        <Volume2 className="h-3.5 w-3.5" />
        <span>AI Speaking</span>
        <div className="flex space-x-1">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    );
  }
  
  return null;
};

export default VoiceStatusIndicator;