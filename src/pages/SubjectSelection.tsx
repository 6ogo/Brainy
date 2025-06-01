import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Book, FlaskRound as Flask, Languages as Language, History, GraduationCap } from 'lucide-react';
import { useStore } from '../store/store';
import { Subject } from '../types';
import { Card } from '../components/Card';
import { cn, commonStyles } from '../styles/utils';

const subjects: Array<{
  id: Subject;
  name: string;
  icon: React.ElementType;
  description: string;
  color: string;
}> = [
  {
    id: 'Math',
    name: 'Mathematics',
    icon: Brain,
    description: 'Master calculus, algebra, and more with interactive problem-solving',
    color: 'bg-blue-500',
  },
  {
    id: 'Science',
    name: 'Science',
    icon: Flask,
    description: 'Explore physics, chemistry, and biology through experiments',
    color: 'bg-green-500',
  },
  {
    id: 'English',
    name: 'English',
    icon: Book,
    description: 'Improve writing, grammar, and literature analysis',
    color: 'bg-purple-500',
  },
  {
    id: 'History',
    name: 'History',
    icon: History,
    description: 'Journey through world events and cultural developments',
    color: 'bg-amber-500',
  },
  {
    id: 'Languages',
    name: 'Languages',
    icon: Language,
    description: 'Learn new languages through immersive conversations',
    color: 'bg-rose-500',
  },
  {
    id: 'Test Prep',
    name: 'Test Prep',
    icon: GraduationCap,
    description: 'Prepare for standardized tests with targeted practice',
    color: 'bg-indigo-500',
  },
];

export const SubjectSelection: React.FC = () => {
  const { setCurrentSubject } = useStore();
  const navigate = useNavigate();

  const handleSubjectSelect = (subject: Subject) => {
    setCurrentSubject(subject);
    navigate('/study');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className={cn(commonStyles.heading.h1, "mb-4")}>
            Choose Your Subject
          </h1>
          <p className={cn(commonStyles.text.lg, "max-w-2xl mx-auto")}>
            Select a subject to start your personalized learning session with your AI tutor
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <Card
              key={subject.id}
              variant="interactive"
              className="p-6"
              onClick={() => handleSubjectSelect(subject.id)}
            >
              <div className="flex items-start space-x-4">
                <div className={cn(
                  "p-3 rounded-lg text-white",
                  subject.color
                )}>
                  <subject.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className={cn(commonStyles.heading.h3, "mb-2")}>
                    {subject.name}
                  </h3>
                  <p className={cn(commonStyles.text.base)}>
                    {subject.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};