import React from 'react';
import { useStore } from '../store/store';
import { Avatar, AvatarPersonality } from '../types';
import { Users, Brain, Smile, GraduationCap, Heart } from 'lucide-react';

const avatars: Avatar[] = [
  {
    id: 'encouraging-emma',
    name: 'Encouraging Emma',
    description: 'Warm, supportive, and patient teaching style',
    imageUrl: 'https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg',
    style: 'bg-rose-100 text-rose-600',
  },
  {
    id: 'challenge-charlie',
    name: 'Challenge Charlie',
    description: 'Direct approach that pushes critical thinking',
    imageUrl: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg',
    style: 'bg-blue-100 text-blue-600',
  },
  {
    id: 'fun-freddy',
    name: 'Fun Freddy',
    description: 'Uses humor and creative analogies',
    imageUrl: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg',
    style: 'bg-yellow-100 text-yellow-600',
  },
  {
    id: 'professor-patricia',
    name: 'Professor Patricia',
    description: 'Formal academic style with detailed explanations',
    imageUrl: 'https://images.pexels.com/photos/3796217/pexels-photo-3796217.jpeg',
    style: 'bg-purple-100 text-purple-600',
  },
  {
    id: 'buddy-ben',
    name: 'Buddy Ben',
    description: 'Casual, friendly peer-learning approach',
    imageUrl: 'https://images.pexels.com/photos/2406949/pexels-photo-2406949.jpeg',
    style: 'bg-green-100 text-green-600',
  },
];

const avatarIcons = {
  'encouraging-emma': Heart,
  'challenge-charlie': Brain,
  'fun-freddy': Smile,
  'professor-patricia': GraduationCap,
  'buddy-ben': Users,
};

export const AvatarSelector: React.FC = () => {
  const { currentAvatar, setCurrentAvatar } = useStore();
  const [isOpen, setIsOpen] = React.useState(false);

  const selectedAvatar = avatars.find(avatar => avatar.id === currentAvatar);
  const Icon = avatarIcons[currentAvatar];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
      >
        <Icon className="h-5 w-5 text-primary-600" />
        <span className="text-sm font-medium">{selectedAvatar?.name}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 grid gap-3">
            {avatars.map((avatar) => {
              const AvatarIcon = avatarIcons[avatar.id as AvatarPersonality];
              return (
                <button
                  key={avatar.id}
                  className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${
                    currentAvatar === avatar.id
                      ? 'bg-primary-50 border-primary-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setCurrentAvatar(avatar.id as AvatarPersonality);
                    setIsOpen(false);
                  }}
                >
                  <div className={`p-2 rounded-full ${avatar.style}`}>
                    <AvatarIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-medium text-gray-900">{avatar.name}</h3>
                    <p className="text-sm text-gray-500">{avatar.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};