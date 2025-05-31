import React, { useEffect, useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useStore } from '../store/store';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { VoiceControls } from './VoiceControls';
import { VideoControls } from './VideoControls';
import { AvatarSelector } from './AvatarSelector';

export const VideoArea: React.FC = () => {
  const { 
    isListening,
    isSpeaking,
    isVideoEnabled,
    currentAvatar,
    currentBackground,
    avatarEmotion
  } = useStore();
  const { error } = useVoiceRecognition();
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVideoLoaded(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

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
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900"></div>
            )}

            <div className={`relative w-64 h-64 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden transition-transform duration-300 ${
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

            {isListening && (
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center justify-center space-x-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div 
                    key={i}
                    className="w-1.5 bg-accent-500"
                    style={{
                      height: `${Math.floor(Math.random() * 30) + 5}px`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  ></div>
                ))}
              </div>
            )}
          </div>
        )}
        
        <div className="absolute top-4 right-4 flex space-x-2">
          {isListening ? (
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
        
        {error && (
          <div className="absolute top-4 right-4 bg-error-500 text-white text-xs rounded-md px-2 py-1">
            {error}
          </div>
        )}

        <VideoControls />
      </div>
      
      <VoiceControls />
    </div>
  );
};