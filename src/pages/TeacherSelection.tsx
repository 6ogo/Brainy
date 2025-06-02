import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/store';
import { Card } from '../components/Card';
import { cn, commonStyles } from '../styles/utils';
import { AvatarPersonality } from '../types';

const teachers: Array<{
  id: AvatarPersonality;
  name: string;
  description: string;
  imageUrl: string;
  specialty: string;
  style: string;
}> = [
  {
    id: 'encouraging-emma',
    name: 'Encouraging Emma',
    description: 'Supportive and patient teacher who focuses on building confidence through positive reinforcement',
    imageUrl: 'https://images.pexels.com/photos/5212324/pexels-photo-5212324.jpeg',
    specialty: 'Making complex topics accessible',
    style: 'bg-rose-100 border-rose-300',
  },
  {
    id: 'challenge-charlie',
    name: 'Challenge Charlie',
    description: 'Pushes you to your limits with advanced problems and thought experiments to accelerate your learning',
    imageUrl: 'https://images.pexels.com/photos/8197534/pexels-photo-8197534.jpeg',
    specialty: 'Advanced problem-solving',
    style: 'bg-blue-100 border-blue-300',
  },
  {
    id: 'fun-freddy',
    name: 'Fun Freddy',
    description: 'Makes learning enjoyable with games, stories, and interactive examples that stick in your memory',
    imageUrl: 'https://images.pexels.com/photos/3777564/pexels-photo-3777564.jpeg',
    specialty: 'Engaging and interactive learning',
    style: 'bg-yellow-100 border-yellow-300',
  },
];

export const TeacherSelection: React.FC = () => {
  const { currentSubject, setCurrentAvatar } = useStore();
  const navigate = useNavigate();

  const handleTeacherSelect = (teacher: AvatarPersonality) => {
    setCurrentAvatar(teacher);
    navigate('/study'); // Navigate directly to study page instead of learning mode
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className={cn(commonStyles.heading.h1, "mb-4")}>
            Choose Your Teacher
          </h1>
          <p className={cn(commonStyles.text.lg, "max-w-2xl mx-auto")}>
            Select a teacher for your {currentSubject} session
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {teachers.map((teacher) => (
            <Card
              key={teacher.id}
              variant="interactive"
              className={cn("p-6 border-2", teacher.style)}
              onClick={() => handleTeacherSelect(teacher.id)}
            >
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-2 border-primary-300">
                  <img 
                    src={teacher.imageUrl} 
                    alt={teacher.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className={cn(commonStyles.heading.h3, "mb-2 text-center")}>
                  {teacher.name}
                </h3>
                <p className="text-sm text-primary-700 font-medium mb-2">
                  Specialty: {teacher.specialty}
                </p>
                <p className={cn(commonStyles.text.base, "text-center")}>
                  {teacher.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};