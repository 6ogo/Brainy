import React, { useState, useEffect } from 'react';
import { Sliders, Shield, Clock, Volume2, VolumeX, Info, RefreshCw, AlertTriangle, Headphones } from 'lucide-react';
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
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [audioFeedbackRisk, setAudioFeedbackRisk] = useState<'low' | 'medium' | 'high'>('medium');
  const [isUsingHeadphones, setIsUsingHeadphones] = useState(false);
  
  // Test for audio feedback risk on component mount
  useEffect(() => {
    testAudioFeedbackRisk();
  }, []);
  
  const testAudioFeedbackRisk = async () => {
    setIsTestingAudio(true);
    try {
      // Create audio context for testing
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Try to get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Create analyzer to measure audio levels
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256;
      
      // Connect microphone to analyzer
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyzer);
      
      // Create data array for frequency data
      const dataArray = new Uint8Array(analyzer.frequencyBinCount);
      
      // Play a test tone
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.1; // Low volume to avoid actual feedback
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 440; // A4 note
      oscillator.start();
      
      // Measure microphone input after playing tone
      setTimeout(() => {
        // Get frequency data
        analyzer.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        const average = Array.from(dataArray).reduce((sum, value) => sum + value, 0) / dataArray.length;
        
        // Determine feedback risk based on volume
        if (average > 100) {
          setAudioFeedbackRisk('high');
        } else if (average > 50) {
          setAudioFeedbackRisk('medium');
        } else {
          setAudioFeedbackRisk('low');
        }
        
        // Stop test tone
        oscillator.stop();
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
        
        setIsTestingAudio(false);
      }, 500);
    } catch (error) {
      console.error('Error testing audio feedback risk:', error);
      setAudioFeedbackRisk('medium'); // Default to medium if test fails
      setIsTestingAudio(false);
    }
  };
  
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
  
  const toggleHeadphonesMode = () => {
    setIsUsingHeadphones(!isUsingHeadphones);
    
    // If enabling headphones mode, we can reduce feedback prevention measures
    if (!isUsingHeadphones) {
      // Reduce delay after speaking for headphones users
      setDelayAfterSpeaking(300); // 300ms is enough for headphones
      toast.success('Headphones mode enabled - reduced delay after speaking');
    } else {
      // Restore normal delay for speakers
      setDelayAfterSpeaking(500);
      toast.success('Headphones mode disabled - restored normal delay');
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
      
      {/* Audio Feedback Risk Indicator */}
      <div className="mb-4 p-3 rounded-lg border flex items-start space-x-3"
        style={{
          backgroundColor: audioFeedbackRisk === 'high' ? 'rgba(254, 226, 226, 0.5)' : 
                          audioFeedbackRisk === 'medium' ? 'rgba(254, 243, 199, 0.5)' : 
                          'rgba(236, 253, 245, 0.5)',
          borderColor: audioFeedbackRisk === 'high' ? 'rgb(248, 113, 113)' : 
                      audioFeedbackRisk === 'medium' ? 'rgb(251, 191, 36)' : 
                      'rgb(52, 211, 153)'
        }}
      >
        <div className="mt-0.5">
          {audioFeedbackRisk === 'high' ? (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          ) : audioFeedbackRisk === 'medium' ? (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          ) : (
            <Shield className="h-4 w-4 text-green-500" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium" 
            style={{ 
              color: audioFeedbackRisk === 'high' ? 'rgb(185, 28, 28)' : 
                    audioFeedbackRisk === 'medium' ? 'rgb(180, 83, 9)' : 
                    'rgb(6, 95, 70)' 
            }}
          >
            {audioFeedbackRisk === 'high' ? 'High feedback risk detected' : 
             audioFeedbackRisk === 'medium' ? 'Moderate feedback risk' : 
             'Low feedback risk'}
          </p>
          <p className="text-xs" 
            style={{ 
              color: audioFeedbackRisk === 'high' ? 'rgb(220, 38, 38)' : 
                    audioFeedbackRisk === 'medium' ? 'rgb(217, 119, 6)' : 
                    'rgb(16, 185, 129)' 
            }}
          >
            {audioFeedbackRisk === 'high' ? 
              'We strongly recommend keeping feedback prevention enabled and using headphones.' : 
             audioFeedbackRisk === 'medium' ? 
              'Feedback prevention is recommended for your audio setup.' : 
              'Your audio setup has low feedback risk, but prevention is still recommended.'}
          </p>
          {audioFeedbackRisk === 'high' && !isUsingHeadphones && (
            <div className="mt-2 flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Headphones className="h-3 w-3" />}
                onClick={toggleHeadphonesMode}
              >
                I'm Using Headphones
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Shield className="h-3 w-3" />}
                onClick={() => {
                  if (!feedbackPreventionEnabled) {
                    toggleFeedbackPrevention();
                  }
                  toast.success('Feedback prevention enabled');
                }}
              >
                Enable Protection
              </Button>
            </div>
          )}
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