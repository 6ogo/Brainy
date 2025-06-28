import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/store';
import { Volume2, VolumeX, Pause, Play, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../styles/utils';
import { ElevenLabsService } from '../services/elevenlabsService';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';

interface VoiceOutputProcessorProps {
  text?: string;
  autoPlay?: boolean;
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
  className?: string;
}

export const VoiceOutputProcessor: React.FC<VoiceOutputProcessorProps> = ({
  text,
  autoPlay = false,
  onPlayStart,
  onPlayEnd,
  className
}) => {
  const { currentAvatar, setIsSpeaking } = useStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  
  // Get current location to check if we're on the study page
  const location = useLocation();
  const isStudyPage = location.pathname === '/study';
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, []);
  
  // Auto-play when text changes
  useEffect(() => {
    if (text && autoPlay && !isPlaying && !isPaused && isStudyPage) {
      handlePlay();
    }
  }, [text, autoPlay, isPlaying, isPaused, isStudyPage]);
  
  const handlePlay = async () => {
    // Only allow voice output on the study page
    if (!isStudyPage) {
      console.warn('Attempted to play audio outside of study page');
      return;
    }
    
    if (!text || isPlaying) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Generate speech
      const audioBlob = await ElevenLabsService.generateSpeech(text, currentAvatar);
      
      // Create audio element
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      
      audioUrlRef.current = URL.createObjectURL(audioBlob);
      audioRef.current = new Audio(audioUrlRef.current);
      audioRef.current.volume = volume;
      
      // Set up event handlers
      audioRef.current.onplay = () => {
        setIsPlaying(true);
        setIsPaused(false);
        setIsSpeaking(true);
        onPlayStart?.();
      };
      
      audioRef.current.onpause = () => {
        if (!audioRef.current?.ended) {
          setIsPaused(true);
        }
      };
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setIsSpeaking(false);
        onPlayEnd?.();
      };
      
      audioRef.current.onerror = (e) => {
        console.error('Audio playback error:', e);
        setError('Failed to play audio');
        setIsPlaying(false);
        setIsPaused(false);
        setIsSpeaking(false);
        onPlayEnd?.();
      };
      
      // Play audio
      await audioRef.current.play();
    } catch (err) {
      console.error('Error playing audio:', err);
      setError('Failed to generate or play speech');
      
      // Try browser's speech synthesis as fallback
      if ('speechSynthesis' in window && text) {
        try {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.volume = volume;
          
          utterance.onstart = () => {
            setIsPlaying(true);
            setIsSpeaking(true);
            onPlayStart?.();
          };
          
          utterance.onend = () => {
            setIsPlaying(false);
            setIsSpeaking(false);
            onPlayEnd?.();
          };
          
          utterance.onerror = () => {
            setIsPlaying(false);
            setIsSpeaking(false);
            onPlayEnd?.();
          };
          
          window.speechSynthesis.speak(utterance);
        } catch (synthError) {
          console.error('Speech synthesis fallback failed:', synthError);
          toast.error('Voice output failed. Please check your audio settings.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePause = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPaused(true);
      setIsSpeaking(false);
    } else if ('speechSynthesis' in window && isPlaying) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsSpeaking(false);
    }
  };
  
  const handleResume = () => {
    if (audioRef.current && isPaused) {
      audioRef.current.play().catch(err => {
        console.error('Error resuming audio:', err);
        setError('Failed to resume audio playback');
      });
      setIsPaused(false);
      setIsSpeaking(true);
    } else if ('speechSynthesis' in window && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsSpeaking(true);
    }
  };
  
  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    setIsPlaying(false);
    setIsPaused(false);
    setIsSpeaking(false);
    onPlayEnd?.();
  };
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };
  
  // If not on study page, don't render the component
  if (!isStudyPage) {
    return null;
  }
  
  return (
    <div className={cn("p-4 bg-gray-50 rounded-lg", className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Voice Output</h3>
        <div className="flex items-center space-x-2">
          {isPlaying && !isPaused && (
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          )}
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center">
          <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
          {error}
        </div>
      )}
      
      {/* Playback controls */}
      <div className="flex items-center space-x-2 mb-3">
        {!isPlaying && !isPaused ? (
          <Button
            variant="primary"
            size="sm"
            onClick={handlePlay}
            disabled={!text || isLoading}
            isLoading={isLoading}
            className="flex-1"
          >
            Play
          </Button>
        ) : isPaused ? (
          <Button
            variant="primary"
            size="sm"
            onClick={handleResume}
            leftIcon={<Play className="h-4 w-4" />}
            className="flex-1"
          >
            Resume
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePause}
            leftIcon={<Pause className="h-4 w-4" />}
            className="flex-1"
          >
            Pause
          </Button>
        )}
        
        {(isPlaying || isPaused) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleStop}
            className="flex-1"
          >
            Stop
          </Button>
        )}
      </div>
      
      {/* Volume control */}
      <div className="flex items-center space-x-3">
        <VolumeX className="h-4 w-4 text-gray-500" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={handleVolumeChange}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
        <Volume2 className="h-4 w-4 text-gray-500" />
      </div>
      
      {/* Text preview */}
      {text && (
        <div className="mt-3 p-2 bg-gray-100 rounded text-xs text-gray-700 max-h-20 overflow-y-auto">
          {text.length > 100 ? `${text.substring(0, 100)}...` : text}
        </div>
      )}
    </div>
  );
};

export default VoiceOutputProcessor;