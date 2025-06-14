import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Book, Target, Clock, Users, ChevronRight } from 'lucide-react';
import { useStore } from '../store/store';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { cn, commonStyles } from '../styles/utils';
import { Subject, DifficultyLevel } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Confetti from 'react-confetti';
import toast from 'react-hot-toast';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
}

const steps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Brainbud',
    description: 'Your personal AI tutor that adapts to your learning style'
  },
  {
    id: 'interests',
    title: 'What would you like to learn?',
    description: 'Select your main subjects of interest'
  },
  {
    id: 'goals',
    title: 'Set Your Learning Goals',
    description: 'What do you want to achieve?'
  },
  {
    id: 'schedule',
    title: 'Create Your Study Schedule',
    description: 'When do you learn best?'
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'Let\'s start your learning journey'
  }
];

const subjects: Subject[] = ['Math', 'Science', 'English', 'History', 'Languages', 'Test Prep'];

const goals = [
  { id: 'grades', title: 'Improve Grades', icon: Brain },
  { id: 'test', title: 'Test Preparation', icon: Book },
  { id: 'skills', title: 'Learn New Skills', icon: Target }
];

const schedules = [
  { id: 'morning', title: 'Morning (6AM-12PM)', icon: Clock },
  { id: 'afternoon', title: 'Afternoon (12PM-6PM)', icon: Clock },
  { id: 'evening', title: 'Evening (6PM-12AM)', icon: Clock }
];

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setCurrentSubject, setDifficultyLevel } = useStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
  const [selectedGoal, setSelectedGoal] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('has_completed_onboarding, show_onboarding')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data?.has_completed_onboarding || data?.show_onboarding === false) {
          navigate('/subjects');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        toast.error('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [user, navigate]);

  const skipOnboarding = async (dontShowAgain = false) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          has_completed_onboarding: true,
          show_onboarding: !dontShowAgain,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      navigate('/subjects');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to save preferences');
    }
  };

  const handleNext = async () => {
    if (currentStep === steps.length - 1) {
      if (!user) return;

      try {
        // Save onboarding preferences
        const { error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            has_completed_onboarding: true,
            subjects: selectedSubjects,
            learning_goal: selectedGoal,
            preferred_schedule: selectedSchedule,
            difficulty_level: 'High School',
            updated_at: new Date().toISOString()
          });

        if (error) throw error;

        // Set initial subject if selected
        if (selectedSubjects.length > 0) {
          setCurrentSubject(selectedSubjects[0]);
        }
        setDifficultyLevel('High School'); // Default level
        setShowConfetti(true);
        
        setTimeout(() => {
          navigate('/subjects');
        }, 2000);
      } catch (error) {
        console.error('Error saving preferences:', error);
        toast.error('Failed to save preferences');
      }
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="rounded-full bg-primary-600 p-6">
                <Brain className="h-12 w-12 text-white" />
              </div>
            </div>
            <h2 className={cn(commonStyles.heading.h2, "mb-4")}>
              Your Personal AI Study Buddy
            </h2>
            <p className={cn(commonStyles.text.lg, "mb-8")}>
              Get ready for a revolutionary learning experience tailored just for you
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="p-4 text-center">
                <Brain className="h-8 w-8 mx-auto mb-2 text-primary-600" />
                <h3 className="font-medium">Smart Tutoring</h3>
                <p className="text-sm text-gray-500">Adapts to your style</p>
              </Card>
              <Card className="p-4 text-center">
                <Target className="h-8 w-8 mx-auto mb-2 text-primary-600" />
                <h3 className="font-medium">Personal Goals</h3>
                <p className="text-sm text-gray-500">Track your progress</p>
              </Card>
              <Card className="p-4 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-primary-600" />
                <h3 className="font-medium">Learn Together</h3>
                <p className="text-sm text-gray-500">Join study groups</p>
              </Card>
            </div>
          </div>
        );

      case 'interests':
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {subjects.map(subject => (
              <Card
                key={subject}
                className={cn(
                  "p-4 cursor-pointer transition-all",
                  selectedSubjects.includes(subject)
                    ? "border-2 border-primary-500 bg-primary-50"
                    : "hover:bg-gray-50"
                )}
                onClick={() => {
                  if (selectedSubjects.includes(subject)) {
                    setSelectedSubjects(prev => prev.filter(s => s !== subject));
                  } else {
                    setSelectedSubjects(prev => [...prev, subject]);
                  }
                }}
              >
                <h3 className="font-medium text-center">{subject}</h3>
              </Card>
            ))}
          </div>
        );

      case 'goals':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {goals.map(goal => {
              const Icon = goal.icon;
              return (
                <Card
                  key={goal.id}
                  className={cn(
                    "p-6 cursor-pointer transition-all",
                    selectedGoal === goal.id
                      ? "border-2 border-primary-500 bg-primary-50"
                      : "hover:bg-gray-50"
                  )}
                  onClick={() => setSelectedGoal(goal.id)}
                >
                  <div className="flex flex-col items-center text-center">
                    <Icon className="h-8 w-8 mb-2 text-primary-600" />
                    <h3 className="font-medium">{goal.title}</h3>
                  </div>
                </Card>
              );
            })}
          </div>
        );

      case 'schedule':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {schedules.map(schedule => {
              const Icon = schedule.icon;
              return (
                <Card
                  key={schedule.id}
                  className={cn(
                    "p-6 cursor-pointer transition-all",
                    selectedSchedule === schedule.id
                      ? "border-2 border-primary-500 bg-primary-50"
                      : "hover:bg-gray-50"
                  )}
                  onClick={() => setSelectedSchedule(schedule.id)}
                >
                  <div className="flex flex-col items-center text-center">
                    <Icon className="h-8 w-8 mb-2 text-primary-600" />
                    <h3 className="font-medium">{schedule.title}</h3>
                  </div>
                </Card>
              );
            })}
          </div>
        );

      case 'complete':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="rounded-full bg-primary-600 p-6">
                <Brain className="h-12 w-12 text-white" />
              </div>
            </div>
            <h2 className={cn(commonStyles.heading.h2, "mb-4")}>
              Your Learning Journey Begins!
            </h2>
            <p className={cn(commonStyles.text.lg, "mb-8")}>
              We've personalized everything based on your preferences
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <Card className="p-4">
                <h3 className="font-medium mb-2">Selected Subjects</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedSubjects.map(subject => (
                    <span key={subject} className="px-2 py-1 bg-primary-100 rounded-full text-sm">
                      {subject}
                    </span>
                  ))}
                </div>
              </Card>
              <Card className="p-4">
                <h3 className="font-medium mb-2">Your Goal</h3>
                <p>{goals.find(g => g.id === selectedGoal)?.title}</p>
              </Card>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4">
      {showConfetti && <Confetti recycle={false} />}
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="h-2 bg-gray-200 rounded-full">
              <div
                className="h-2 bg-primary-500 rounded-full transition-all"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-500">
              <span>Start</span>
              <span>Complete</span>
            </div>
          </div>

          {/* Skip button (only show after first step) */}
          {currentStep > 0 && currentStep < steps.length - 1 && (
            <div className="flex justify-end mb-4">
              <Button
                variant="text"
                onClick={() => skipOnboarding(false)}
                className="mr-4"
              >
                Skip
              </Button>
              <Button
                variant="text"
                onClick={() => skipOnboarding(true)}
              >
                Skip & Don't Show Again
              </Button>
            </div>
          )}

          {/* Step content */}
          <div className="mb-8">
            <h1 className={cn(commonStyles.heading.h1, "mb-2")}>
              {steps[currentStep].title}
            </h1>
            <p className={cn(commonStyles.text.lg, "mb-8")}>
              {steps[currentStep].description}
            </p>
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => prev - 1)}
              disabled={currentStep === 0}
            >
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={
                (steps[currentStep].id === 'interests' && selectedSubjects.length === 0) ||
                (steps[currentStep].id === 'goals' && !selectedGoal) ||
                (steps[currentStep].id === 'schedule' && !selectedSchedule)
              }
            >
              {currentStep === steps.length - 1 ? 'Start Learning' : 'Continue'}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};