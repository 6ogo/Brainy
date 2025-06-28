import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../store/store';
import { 
  BookOpen, 
  Brain, 
  Settings, 
  BarChart, 
  Calendar,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PersonalizedLearningDashboard } from '../components/PersonalizedLearningDashboard';
import { LearningPreferencesForm } from '../components/LearningPreferencesForm';
import { WeeklyProgressReport } from '../components/WeeklyProgressReport';

export const PersonalizedLearningPage: React.FC = () => {
  const { user } = useAuth();
  const { currentSubject } = useStore();
  const [activeView, setActiveView] = useState<'dashboard' | 'preferences' | 'report'>('dashboard');
  
  // Mock report data - in a real app, this would come from an API call
  const mockReport = {
    userId: user?.id,
    generatedAt: new Date(),
    weekStartDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    weekEndDate: new Date(),
    overallProgress: 65,
    weeklyStudyTime: 320,
    learningPaths: [
      {
        subject: 'Math',
        difficultyLevel: 'High School',
        completionRate: 75,
        topicsCompleted: 6,
        totalTopics: 8,
        topicsInProgress: 1,
        topicsStruggling: 1
      },
      {
        subject: 'Science',
        difficultyLevel: 'High School',
        completionRate: 40,
        topicsCompleted: 2,
        totalTopics: 5,
        topicsInProgress: 2,
        topicsStruggling: 1
      }
    ],
    learningStyle: 'visual',
    consistencyRating: 'Good',
    retentionRate: 78,
    recommendations: [
      'Focus on completing your Math learning path before starting new subjects',
      'Try using more visual learning resources to match your learning style',
      'Schedule your study sessions in the afternoon when you\'re most productive',
      'Review the "Chemical Reactions" topic which you\'re currently struggling with',
      'Maintain your current study schedule of 4-5 days per week for optimal learning'
    ]
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <Link 
                to="/analytics" 
                className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Analytics
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">
              Personalized Learning
            </h1>
            <p className="text-gray-600">
              Customized learning paths and recommendations based on your learning style and progress
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button
              variant={activeView === 'dashboard' ? 'primary' : 'outline'}
              onClick={() => setActiveView('dashboard')}
              leftIcon={<BookOpen className="h-4 w-4" />}
            >
              Learning Paths
            </Button>
            
            <Button
              variant={activeView === 'preferences' ? 'primary' : 'outline'}
              onClick={() => setActiveView('preferences')}
              leftIcon={<Settings className="h-4 w-4" />}
            >
              Preferences
            </Button>
            
            <Button
              variant={activeView === 'report' ? 'primary' : 'outline'}
              onClick={() => setActiveView('report')}
              leftIcon={<Calendar className="h-4 w-4" />}
            >
              Weekly Report
            </Button>
          </div>
        </div>
        
        {/* Main Content */}
        {activeView === 'dashboard' && (
          <PersonalizedLearningDashboard />
        )}
        
        {activeView === 'preferences' && (
          <LearningPreferencesForm />
        )}
        
        {activeView === 'report' && (
          <WeeklyProgressReport report={mockReport} />
        )}
      </div>
    </div>
  );
};

export default PersonalizedLearningPage;