import React, { useState } from 'react';
import { Mic, PhoneOff, Volume2, VolumeX, User } from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  avatarUrl?: string;
  isSpeaking?: boolean;
}

interface VoiceChatPanelProps {
  connected: boolean;
  onCallToggle: () => void;
  onMuteToggle: () => void;
  onSpeakerToggle: () => void;
  isMuted: boolean;
  isSpeakerOn: boolean;
  duration: number;
  participants: Participant[];
  currentUserId: string;
}

const VoiceChatPanel: React.FC<VoiceChatPanelProps> = ({
  connected,
  onCallToggle,
  onMuteToggle,
  onSpeakerToggle,
  isMuted,
  isSpeakerOn,
  duration,
  participants,
  currentUserId,
}) => {
  // Placeholder for audio visualization
  const [visualization, setVisualization] = useState<number[]>([0, 1, 0, 2, 1, 0, 3, 2]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="voice-chat-panel bg-white rounded-lg shadow-md p-6 flex flex-col items-center">
      <div className="flex items-center space-x-4 mb-4">
        {participants.map((p) => (
          <div key={p.id} className={`relative flex flex-col items-center ${p.isSpeaking ? 'ring-2 ring-green-400' : ''}`}>
            <img
              src={p.avatarUrl || '/default-avatar.png'}
              alt={p.name}
              className="w-12 h-12 rounded-full border border-gray-200"
            />
            <span className="text-xs mt-1">{p.name}{p.id === currentUserId && ' (You)'}</span>
            {p.isSpeaking && <span className="absolute -top-2 right-0 text-green-500">●</span>}
          </div>
        ))}
      </div>
      <div className="audio-visualization flex space-x-1 mb-4 h-6">
        {visualization.map((val, idx) => (
          <div key={idx} className="w-2 bg-blue-400 rounded" style={{ height: `${8 + val * 8}px` }}></div>
        ))}
      </div>
      <div className="flex items-center space-x-6 mb-4">
        <button
          onClick={onMuteToggle}
          className={`p-3 rounded-full bg-gray-100 hover:bg-gray-200 ${isMuted ? 'text-red-500' : 'text-gray-700'}`}
          aria-label="Mute"
        >
          {isMuted ? <Mic className="w-6 h-6 line-through" /> : <Mic className="w-6 h-6" />}
        </button>
        <button
          onClick={onCallToggle}
          className={`p-4 rounded-full ${connected ? 'bg-red-500' : 'bg-green-500'} text-white shadow-lg focus:outline-none focus:ring-4 focus:ring-primary-200`}
          aria-label={connected ? 'End Call' : 'Start Call'}
        >
          <PhoneOff className="w-8 h-8" />
        </button>
        <button
          onClick={onSpeakerToggle}
          className={`p-3 rounded-full bg-gray-100 hover:bg-gray-200 ${isSpeakerOn ? 'text-green-500' : 'text-gray-700'}`}
          aria-label="Speaker"
        >
          {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
        </button>
      </div>
      <div className="text-sm text-gray-600 mb-2">Duration: {formatDuration(duration)}</div>
      <div className="flex items-center space-x-2">
        <span className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
        <span className="text-xs">{connected ? 'Connected' : 'Disconnected'}</span>
      </div>
    </div>
  );
};

export default VoiceChatPanel;
