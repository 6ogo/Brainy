import React, { useEffect, useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useStore } from '../store/store';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { useVoiceChat } from '../hooks/useVoiceChat';
import { VoiceControls } from './VoiceControls';
import { VideoControls } from './VideoControls';
import { AvatarSelector } from './AvatarSelector';
import { TavusService } from '../services/tavusService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const VideoArea: React.FC = () => {
  const { 
    isListening,
    isSpeaking,
    isVideoEnabled,
    currentBackground,
    avatarEmotion,
    voiceMode,
    learningMode
  } = useStore();
  
  const { user } = useAuth();
  const { error: recognitionError } = useVoiceRecognition();
  const { isActive: voiceChatActive, error: voiceChatError } = useVoiceChat();
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isEligibleForTavus, setIsEligibleForTavus] = useState(false);
  const [tavusVideoUrl, setTavusVideoUrl] = useState<string | null>(null);
  const [isLoadingTavus, setIsLoadingTavus] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVideoLoaded(true);
    }, 1000);

    // Check Tavus eligibility
    if (user) {
      TavusService.checkEligibilityForTavus(user.id)
        .then(eligible => {
          setIsEligibleForTavus(eligible);
        })
        .catch(error => {
          console.error('Error checking Tavus eligibility:', error);
        });
    }

    return () => clearTimeout(timer);
  }, [user]);

  const handleTavusVideo = async () => {
    if (!user) return;

    try {
      setIsLoadingTavus(true);
      const video = await TavusService.createStudyTipVideo(
        user.id,
        'Math' // Using current subject would be better
      );

      setTavusVideoUrl(video.url);
      toast.success('Your personalized study counselor video is ready!');
    } catch (error) {
      console.error('Error generating Tavus video:', error);
      toast.error('Failed to generate study counselor video');
    } finally {
      setIsLoadingTavus(false);
    }
  };

  if (!isEligibleForTavus) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg p-8 text-center">
        <div>
          <h3 className="text-xl font-semibold mb-2">Complete 3 Learning Sessions</h3>
          <p className="text-gray-600">
            Continue learning through conversations to unlock personalized video sessions with your study counselor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col">
      <div className="absolute top-4 left-4 z-10">
        <AvatarSelector />
      </div>

      <div className="flex-1 bg-gray-900 rounded-lg overflow-hidden relative">
        {!videoLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center relative">
            {isVideoEnabled ? (
              <>
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(https://images.pexels.com/photos/${
                      currentBackground === 'classroom' ? '8471970' :
                      currentBackground === 'library' ? '590493' :
                      currentBackground === 'home-office' ? '4050315' :
                      '7135121'
                    }/pexels-photo-${
                      currentBackground === 'classroom' ? '8471970' :
                      currentBackground === 'library' ? '590493' :
                      currentBackground === 'home-office' ? '4050315' :
                      '7135121'
                    }.jpeg)`
                  }}
                >
                  <div className="absolute inset-0 bg-black/30"></div>
                </div>

                {tavusVideoUrl ? (
                  <video
                    src={tavusVideoUrl}
                    autoPlay
                    controls
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="relative z-10 flex flex-col items-center justify-center">
                    <div className={`w-64 h-64 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden transition-transform duration-300 ${
                      avatarEmotion === 'thinking' ? 'scale-105' :
                      avatarEmotion === 'excited' ? 'scale-110' :
                      'scale-100'
                    }`}>
                      <div className="absolute inset-0 bg-gradient-to-b from-primary-300 to-primary-600 opacity-50"></div>
                      <div className="w-40 h-40 rounded-full bg-primary-200 flex items-center justify-center z-10">
                        <span className="text-6xl font-bold text-primary-700">AI</span>
                      </div>
                      
                      {isSpeaking && (
                        <div className="absolute inset-0 bg-primary-500 rounded-full animate-pulse-slow opacity-20"></div>
                      )}
                    </div>
                    
                    <button
                      onClick={handleTavusVideo}
                      disabled={isLoadingTavus}
                      className="mt-6 px-4 py-2 bg-white text-primary-600 rounded-lg shadow-md hover:bg-primary-50 transition-colors"
                    >
                      {isLoadingTavus ? 'Loading video...' : 'Get personalized study tips'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900"></div>
            )}
          </div>
        )}
        
        <div className="absolute top-4 right-4 flex space-x-2">
          {isListening && voiceMode !== 'muted' ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-500 text-white">
              <Mic className="w-3 h-3 mr-1" /> Listening
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500 text-white">
              <MicOff className="w-3 h-3 mr-1" /> Mic Off
            </span>
          )}
          
          {isSpeaking ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-500 text-white">
              <Volume2 className="w-3 h-3 mr-1" /> Speaking
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500 text-white">
              <VolumeX className="w-3 h-3 mr-1" /> Silent
            </span>
          )}
        </div>
        
        {(recognitionError || voiceChatError) && (
          <div className="absolute top-4 right-4 bg-error-500 text-white text-xs rounded-md px-2 py-1">
            {recognitionError || voiceChatError}
          </div>
        )}

        <VideoControls />
      </div>
      
      <VoiceControls />
    </div>
  );
};