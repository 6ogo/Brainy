import React from 'react';
import { useStore } from '../store/store';
import { Video, VideoOff, Image as ImageIcon, SwordIcon as Record, StopCircle, Settings } from 'lucide-react';

const backgrounds = [
  { id: 'classroom', name: 'Classroom' },
  { id: 'library', name: 'Library' },
  { id: 'home-office', name: 'Home Office' },
  { id: 'futuristic', name: 'Futuristic' },
];

export const VideoControls: React.FC = () => {
  const { 
    isVideoEnabled,
    isRecording,
    currentBackground,
    toggleVideo,
    toggleRecording,
    setCurrentBackground
  } = useStore();

  const [showBackgrounds, setShowBackgrounds] = React.useState(false);

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 bg-black/50 rounded-full px-4 py-2">
      <button
        onClick={toggleVideo}
        className={`p-2 rounded-full ${
          isVideoEnabled ? 'bg-primary-500 text-white' : 'bg-gray-600 text-gray-200'
        }`}
        title={isVideoEnabled ? 'Disable video' : 'Enable video'}
      >
        {isVideoEnabled ? (
          <Video className="h-5 w-5" />
        ) : (
          <VideoOff className="h-5 w-5" />
        )}
      </button>

      <div className="relative">
        <button
          onClick={() => setShowBackgrounds(!showBackgrounds)}
          className="p-2 rounded-full hover:bg-gray-700/50"
          title="Change background"
        >
          <ImageIcon className="h-5 w-5 text-white" />
        </button>

        {showBackgrounds && (
          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg py-2 min-w-[160px]">
            {backgrounds.map((bg) => (
              <button
                key={bg.id}
                className={`w-full px-4 py-2 text-left text-sm ${
                  currentBackground === bg.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
                onClick={() => {
                  setCurrentBackground(bg.id as any);
                  setShowBackgrounds(false);
                }}
              >
                {bg.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={toggleRecording}
        className={`p-2 rounded-full ${
          isRecording ? 'bg-error-500 text-white' : 'hover:bg-gray-700/50 text-white'
        }`}
        title={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {isRecording ? (
          <StopCircle className="h-5 w-5" />
        ) : (
          <Record className="h-5 w-5" />
        )}
      </button>

      <button
        className="p-2 rounded-full hover:bg-gray-700/50"
        title="Video settings"
      >
        <Settings className="h-5 w-5 text-white" />
      </button>
    </div>
  );
};