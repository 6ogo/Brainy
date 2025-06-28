import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/store';
import { cn, commonStyles } from '../styles/utils';
import { AvatarPersonality } from '../types';
import { ArrowLeft } from 'lucide-react';
import { TeacherCard } from '../components/TeacherCard';

const teachers: Array<{
  id: AvatarPersonality;
  name: string;
  description: string;
  imageUrl: string;
  specialty: string;
  style: string;
  convaiId: string;
}> = [
  {
    id: 'encouraging-emma',
    name: 'Encouraging Emma',
    description: 'Supportive and patient teacher who builds confidence through clear explanations and positive reinforcement',
    imageUrl: '/EMMA.jpg',
    specialty: 'Making complex topics accessible',
    style: 'bg-rose-100 border-rose-300',
    convaiId: 'emma'
  },
  {
    id: 'challenge-charlie',
    name: 'Challenge Charlie',
    description: 'Dynamic and engaging teacher who pushes your boundaries with advanced concepts and thought-provoking questions',
    imageUrl: '/CHARLIE.png',
    specialty: 'Advanced problem-solving',
    style: 'bg-blue-100 border-blue-300',
    convaiId: 'charlie'
  },
  {
    id: 'fun-freddy',
    name: 'Fun Freddy',
    description: 'Makes learning enjoyable with games, stories, and interactive examples that stick in your memory',
    imageUrl: '/FREDDY.webp',
    specialty: 'Engaging and interactive learning',
    style: 'bg-yellow-100 border-yellow-300',
    convaiId: 'freddy'
  },
];

export const TeacherSelection: React.FC = () => {
  const { currentSubject } = useStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back to Subjects Button */}
        <div className="mb-8">
          <Link 
            to="/subjects" 
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Subjects
          </Link>
        </div>
        
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
            <TeacherCard
              key={teacher.id}
              id={teacher.id}
              name={teacher.name}
              description={teacher.description}
              imageUrl={teacher.imageUrl}
              specialty={teacher.specialty}
              style={teacher.style}
              convaiId={teacher.convaiId}
            />
          ))}
        </div>
      </div>
    </div>
  );
};