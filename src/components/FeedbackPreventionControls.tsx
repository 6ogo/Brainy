import React, { useState } from 'react';
import { Sliders, Shield, Clock, Volume2, VolumeX, Info, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../styles/utils';
import { ElevenLabsService } from '../services/elevenlabsService';
import toast from 'react-hot-toast';

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
  const [isResetting, setIsResetting] = useState(false);
  
  const handleResetElevenLabsQuota = async () => {
    setIsResetting(true);
    try {
      // Reset quota status
      ElevenLabsService.resetQuotaStatus();
      
      // Check if API is working
      const isWorking = await ElevenLabsService.checkApiStatus();
      
      if (isWorking) {
        toast.success('ElevenLabs API connection restored');
      } else {
        toast.error('ElevenLabs API still unavailable. Using browser speech synthesis.');
      }
    } catch (error) {
      console.error('Error resetting ElevenLabs quota:', error);
      toast.error('Failed to reset ElevenLabs connection');
    } finally {
      setIsResetting(false);
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
        <Button
          variant={feedbackPreventionEnabled ? "primary" : "outline"}
          size="sm"
          onClick={toggleFeedbackPrevention}
        >
          {feedbackPreventionEnabled ? "Enabled" : "Disabled"}
        </Button>
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
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
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
      
      {/* ElevenLabs API Status */}
      {ElevenLabsService.isQuotaExceeded() && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="text-amber-600 mt-0.5">
              <Volume2 className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-amber-800">
                ElevenLabs Quota Exceeded
              </h4>
              <p className="text-xs text-amber-700 mt-1">
                Your ElevenLabs API quota has been exceeded. The system is currently using browser speech synthesis as a fallback.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetElevenLabsQuota}
                className="mt-2"
                leftIcon={<RefreshCw className="h-3 w-3" />}
                isLoading={isResetting}
              >
                Reset Connection
              </Button>
            </div>
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