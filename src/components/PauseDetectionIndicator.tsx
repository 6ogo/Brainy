import React, { useEffect, useState } from 'react';
import { cn } from '../styles/utils';

interface PauseDetectionIndicatorProps {
  isListening: boolean;
  pauseThreshold: number;
  lastSpeechTimestamp: number;
  className?: string;
}

export const PauseDetectionIndicator: React.FC<PauseDetectionIndicatorProps> = ({
  isListening,
  pauseThreshold,
  lastSpeechTimestamp,
  className
}) => {
  const [progress, setProgress] = useState(0);
  const [isActive, setIsActive] = useState(false);
  
  useEffect(() => {
    if (!isListening || !lastSpeechTimestamp) {
      setIsActive(false);
      setProgress(0);
      return;
    }
    
    let animationFrameId: number;
    let startTime = performance.now();
    
    const updateProgress = () => {
      const now = performance.now();
      const elapsed = now - startTime;
      const timeSinceLastSpeech = Date.now() - lastSpeechTimestamp;
      
      if (timeSinceLastSpeech > 100) {
        setIsActive(true);
        const newProgress = Math.min(100, (timeSinceLastSpeech / pauseThreshold) * 100);
        setProgress(newProgress);
        
        if (timeSinceLastSpeech < pauseThreshold) {
          animationFrameId = requestAnimationFrame(updateProgress);
        } else {
          // Pause threshold reached
          setIsActive(false);
        }
      } else {
        setIsActive(false);
        setProgress(0);
        animationFrameId = requestAnimationFrame(updateProgress);
      }
    };
    
    animationFrameId = requestAnimationFrame(updateProgress);
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isListening, lastSpeechTimestamp, pauseThreshold]);
  
  if (!isActive) return null;
  
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className="relative w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full bg-amber-500 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs text-gray-500">
        {progress < 100 ? 'Waiting...' : 'Processing'}
      </span>
    </div>
  );
};

export default PauseDetectionIndicator;