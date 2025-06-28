import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from './Card';
import { Button } from './Button';
import { cn, commonStyles } from '../styles/utils';
import { MessageSquare, Video } from 'lucide-react';
import { useStore } from '../store/store';
import { AvatarPersonality } from '../types';

interface TeacherCardProps {
  id: AvatarPersonality;
  name: string;
  description: string;
  imageUrl: string;
  specialty: string;
  style: string;
  convaiId: string;
  className?: string;
}

export const TeacherCard: React.FC<TeacherCardProps> = ({
  id,
  name,
  description,
  imageUrl,
  specialty,
  style,
  convaiId,
  className
}) => {
  const { setCurrentAvatar } = useStore();
  const navigate = useNavigate();

  const handleTextVoiceChat = () => {
    setCurrentAvatar(id);
    navigate('/study');
  };

  const handleVideoChat = () => {
    navigate(`/tutor/${convaiId}`);
  };

  return (
    <Card
      variant="interactive"
      className={cn("p-6 border-2", style, className)}
    >
      <div className="flex flex-col items-center">
        <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-2 border-primary-300">
          <img 
            src={imageUrl} 
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
        <h3 className={cn(commonStyles.heading.h3, "mb-2 text-center")}>
          {name}
        </h3>
        <p className="text-sm text-primary-700 font-medium mb-2">
          Specialty: {specialty}
        </p>
        <p className={cn(commonStyles.text.base, "text-center mb-6")}>
          {description}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <Button
            variant="primary"
            onClick={handleTextVoiceChat}
            leftIcon={<MessageSquare className="h-4 w-4" />}
            className="flex-1"
          >
            Text/Voice Chat
          </Button>
          <Button
            variant="secondary"
            onClick={handleVideoChat}
            leftIcon={<Video className="h-4 w-4" />}
            className="flex-1"
          >
            Video Chat
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default TeacherCard;