import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { cn } from '../styles/utils';
import { useStore } from '../store/store';
import { useAuth } from '../contexts/AuthContext';
import { StudyAdvisorButton } from '../components/StudyAdvisorButton';
import { AnalyticsInsights } from '../components/AnalyticsInsights';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { AchievementSystem } from '../components/AchievementSystem';
import { StudyAdvisorInsights } from '../components/StudyAdvisorInsights';
import { LevelProgressBar } from '../components/LevelProgressBar';

export const LearningAnalytics: React.FC = () => {
  const { socialStats, sessionStats } = useStore();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    // Set loading to false after a short delay to simulate data loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className={cn("text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl", "mb-2")}>
              Learning Analytics
            </h1>
            <p className="text-gray-600">Track your progress and gain insights into your learning journey</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <LevelProgressBar className="w-full sm:w-64" />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              className={cn(
                "py-4 px-1 font-medium text-sm border-b-2 -mb-px transition-colors",
                activeTab === 'dashboard'
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={cn(
                "py-4 px-1 font-medium text-sm border-b-2 -mb-px transition-colors",
                activeTab === 'achievements'
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
              onClick={() => setActiveTab('achievements')}
            >
              Achievements
            </button>
            <button
              className={cn(
                "py-4 px-1 font-medium text-sm border-b-2 -mb-px transition-colors",
                activeTab === 'advisor'
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
              onClick={() => setActiveTab('advisor')}
            >
              Study Advisor
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <>
            <AnalyticsDashboard />
            
            <div className="mt-8">
              <AnalyticsInsights 
                totalStudyTime={sessionStats.duration / 60}
                totalConversations={sessionStats.messagesCount / 2}
                averageSessionLength={30}
                currentStreak={socialStats.streak.current}
                totalXP={socialStats.totalXP}
                weeklyProgress={[120, 150, 180, 210]}
              />
            </div>
          </>
        )}
        
        {activeTab === 'achievements' && (
          <AchievementSystem />
        )}
        
        {activeTab === 'advisor' && (
          <div className="space-y-8">
            <StudyAdvisorButton />
            <StudyAdvisorInsights />
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningAnalytics;