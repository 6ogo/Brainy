import React, { useState } from 'react';
import { Shield, Clock, Info, Headphones } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../styles/utils';

interface FeedbackPreventionControlsProps {
  feedbackPreventionEnabled: boolean;
  toggleFeedbackPrevention: () => void;
  delayAfterSpeaking: number;
  setDelayAfterSpeaking: (milliseconds: number) => void;
  className?: string;
}

export const FeedbackPreventionControls: React.FC<FeedbackPreventionControlsProps> = ({
  feedbackPreventionEnabled,
  toggleFeedbackPrevention,
  delayAfterSpeaking,
  setDelayAfterSpeaking,
  className
}) => {
  const [showInfo, setShowInfo] = useState(false);
  const [isUsingHeadphones, setIsUsingHeadphones] = useState(false);
  
  const toggleHeadphonesMode = () => {
    setIsUsingHeadphones(!isUsingHeadphones);
    
    // If enabling headphones mode, we can reduce feedback prevention measures
    if (!isUsingHeadphones) {
      // Reduce delay after speaking for headphones users
      setDelayAfterSpeaking(300); // 300ms is enough for headphones
    } else {
      // Restore normal delay for speakers
      setDelayAfterSpeaking(500);
    }
  };
  
  return (
    <div className={cn("p-4 bg-gray-50 rounded-lg border border-gray-200", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-medium text-gray-700">Feedback Prevention</h3>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="text-gray-400 hover:text-gray-500"
            aria-label="Information about feedback prevention"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={isUsingHeadphones ? "primary" : "outline"}
            size="sm"
            onClick={toggleHeadphonesMode}
            leftIcon={<Headphones className="h-4 w-4" />}
          >
            {isUsingHeadphones ? "Using Headphones" : "Using Speakers"}
          </Button>
          <Button
            variant={feedbackPreventionEnabled ? "primary" : "outline"}
            size="sm"
            onClick={toggleFeedbackPrevention}
            leftIcon={<Shield className="h-4 w-4" />}
          >
            {feedbackPreventionEnabled ? "Enabled" : "Disabled"}
          </Button>
        </div>
      </div>
      
      {showInfo && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
          <p className="font-medium mb-1">What is feedback prevention?</p>
          <p className="text-xs mb-2">
            Feedback prevention stops audio loops that occur when your microphone picks up the AI's voice, 
            creating an echo or high-pitched noise. This system:
          </p>
          <ul className="text-xs list-disc list-inside space-y-1">
            <li>Automatically mutes your microphone while the AI is speaking</li>
            <li>Adds a short delay after the AI finishes before unmuting</li>
            <li>Analyzes audio patterns to detect and prevent potential feedback</li>
            <li>Adjusts microphone sensitivity based on background noise</li>
            <li>Filters out AI voice patterns from speech recognition</li>
          </ul>
        </div>
      )}
      
      {feedbackPreventionEnabled && (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600">Delay After Speaking</span>
              <span className="text-xs text-gray-600">{delayAfterSpeaking}ms</span>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="h-4 w-4 text-gray-500" />
              <input
                type="range"
                min="200"
                max="1000"
                step="50"
                value={delayAfterSpeaking}
                onChange={(e) => setDelayAfterSpeaking(parseInt(e.target.value, 10))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: 'linear-gradient(to right, #3B82F6 0%, #3B82F6 ' + 
                    ((delayAfterSpeaking - 200) / 8) + '%, #E5E7EB ' + 
                    ((delayAfterSpeaking - 200) / 8) + '%, #E5E7EB 100%)'
                }}
                aria-label="Delay After Speaking"
              />
              <Clock className="h-4 w-4 text-gray-700" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              How long to wait after the AI stops speaking before unmuting your microphone
            </p>
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>Active feedback prevention</span>
          </div>
        </div>
      )}
      
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <Shield className="h-3 w-3" />
          <span>Prevents audio feedback loops</span>
        </div>
        <div className="flex items-center space-x-1">
          {feedbackPreventionEnabled ? (
            <>
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="text-green-600">Protected</span>
            </>
          ) : (
            <>
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
              <span className="text-amber-600">Unprotected</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackPreventionControls;