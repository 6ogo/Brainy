import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { cn } from '../styles/utils';
import { useAuth } from '../contexts/AuthContext';
import { StudyAdvisorButton } from '../components/StudyAdvisorButton';
import { AnalyticsInsights } from '../components/AnalyticsInsights';
import { AchievementSystem } from '../components/AchievementSystem';
import { StudyAdvisorInsights } from '../components/StudyAdvisorInsights';
import { Card } from '../components/Card';
import { 
  Clock, 
  MessageSquare, 
  TrendingUp, 
  Calendar
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UserAnalytics {
  totalStudyTime: number; // in minutes
  totalConversations: number;
  currentStreak: number;
  totalXP: number;
  currentLevel: number;
  xpToNextLevel: number;
  xpProgress: number; // percentage to next level
  weeklyProgress: number[];
  subjectBreakdown: { [key: string]: number };
  achievements: any[];
  recentSessions: any[];
  averageSessionLength: number;
}

export const LearningAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<UserAnalytics>({
    totalStudyTime: 0,
    totalConversations: 0,
    currentStreak: 0,
    totalXP: 0,
    currentLevel: 1,
    xpToNextLevel: 100,
    xpProgress: 0,
    weeklyProgress: [0, 0, 0, 0, 0, 0, 0],
    subjectBreakdown: {},
    achievements: [],
    recentSessions: [],
    averageSessionLength: 0
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    if (user) {
      loadUserAnalytics();
    }
  }, [user]);

  const loadUserAnalytics = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load conversations data
      const { data: conversations } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });

      // Load achievement progress with achievements details
      const { data: achievementProgress } = await supabase
        .from('achievement_progress')
        .select(`
          *,
          achievements (
            title,
            description,
            xp_reward,
            requirement_value,
            requirement_type,
            category,
            icon
          )
        `)
        .eq('user_id', user.id);

      // Calculate analytics from real data
      const totalConversations = conversations?.length || 0;
      const totalStudyTimeMinutes = conversations?.reduce((sum, conv) => sum + (conv.duration || 30), 0) || 0; // Default 30 seconds per conversation if not tracked
      
      // Calculate XP from completed achievements
      const completedAchievements = achievementProgress?.filter(progress => 
        progress.current_value >= progress.achievements.requirement_value
      ) || [];
      
      const totalXP = completedAchievements.reduce((sum, progress) => 
        sum + (progress.achievements.xp_reward || 0), 0
      );

      // XP system: Each level requires progressively more XP
      // Level 1: 0-100 XP, Level 2: 100-250 XP, Level 3: 250-450 XP, etc.
      const calculateLevel = (xp: number) => {
        let level = 1;
        let xpRequired = 100;
        let totalXpForLevel = 0;
        
        while (xp >= totalXpForLevel + xpRequired) {
          totalXpForLevel += xpRequired;
          level++;
          xpRequired += 50; // Each level requires 50 more XP than the previous
        }
        
        return {
          level,
          currentLevelXP: xp - totalXpForLevel,
          xpRequiredForNextLevel: xpRequired,
          xpProgress: ((xp - totalXpForLevel) / xpRequired) * 100
        };
      };

      const levelInfo = calculateLevel(totalXP);
      const currentLevel = levelInfo.level;
      const xpToNextLevel = levelInfo.xpRequiredForNextLevel - levelInfo.currentLevelXP;
      const xpProgress = levelInfo.xpProgress;

      // Calculate weekly progress (last 7 days)
      const weeklyProgress = Array(7).fill(0);
      const today = new Date();
      
      conversations?.forEach(conv => {
        const convDate = new Date(conv.timestamp);
        const daysDiff = Math.floor((today.getTime() - convDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff < 7) {
          weeklyProgress[6 - daysDiff] += (conv.duration || 30) / 60; // Convert to minutes
        }
      });

      // Calculate subject breakdown by analyzing conversation content
      const subjectBreakdown: { [key: string]: number } = {};
      conversations?.forEach(conv => {
        const subject = extractSubjectFromConversation(conv) || 'General';
        subjectBreakdown[subject] = (subjectBreakdown[subject] || 0) + (conv.duration || 30) / 60;
      });

      // Calculate current streak
      const currentStreak = calculateStreak(conversations || []);

      // Get recent sessions (last 10)
      const recentSessions = conversations?.slice(0, 10).map(conv => ({
        id: conv.id,
        subject: extractSubjectFromConversation(conv) || 'General',
        duration: Math.round((conv.duration || 30) / 60), // Convert to minutes
        timestamp: conv.timestamp,
        messagesCount: 2 // User + AI message
      })) || [];

      // Calculate average session length
      const averageSessionLength = totalConversations > 0 
        ? Math.round(totalStudyTimeMinutes / totalConversations) 
        : 0;

      setAnalytics({
        totalStudyTime: Math.round(totalStudyTimeMinutes / 60), // Convert to hours for display
        totalConversations,
        currentStreak,
        totalXP,
        currentLevel,
        xpToNextLevel,
        xpProgress,
        weeklyProgress,
        subjectBreakdown,
        achievements: achievementProgress || [],
        recentSessions,
        averageSessionLength
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractSubjectFromConversation = (conversation: any): string | null => {
    // Try to extract subject from conversation content or summary
    const text = (conversation.user_message + ' ' + conversation.ai_response + ' ' + (conversation.summary || '')).toLowerCase();
    const subjects = ['math', 'mathematics', 'english', 'science', 'physics', 'chemistry', 'biology', 'history', 'languages', 'language'];
    
    for (const subject of subjects) {
      if (text.includes(subject)) {
        return subject === 'mathematics' ? 'Math' : 
               subject === 'languages' || subject === 'language' ? 'Languages' :
               subject.charAt(0).toUpperCase() + subject.slice(1);
      }
    }
    return null;
  };

  const calculateStreak = (conversations: any[]): number => {
    if (!conversations.length) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Group conversations by date
    const conversationsByDate = new Map();
    conversations.forEach(conv => {
      const date = new Date(conv.timestamp);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];
      
      if (!conversationsByDate.has(dateStr)) {
        conversationsByDate.set(dateStr, true);
      }
    });
    
    // Calculate consecutive days starting from today
    let currentDate = new Date(today);
    
    // Check if user studied today
    const todayStr = currentDate.toISOString().split('T')[0];
    if (!conversationsByDate.has(todayStr)) {
      // If no study today, check yesterday
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      if (conversationsByDate.has(dateStr)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  const LevelProgressBar = () => {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Level Progress</h3>
            <p className="text-sm text-gray-600">Level {analytics.currentLevel}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary-600">{analytics.totalXP} XP</div>
            <p className="text-sm text-gray-600">{analytics.xpToNextLevel} XP to next level</p>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-4 mb-2 relative overflow-hidden">
          <div 
            className="bg-gradient-to-r from-primary-500 to-primary-600 h-4 rounded-full transition-all duration-500 ease-out relative"
            style={{ width: `${Math.max(5, analytics.xpProgress)}%` }}
          >
            <div className="absolute inset-0 bg-white opacity-20 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        <div className="flex justify-between text-xs text-gray-500">
          <span>Level {analytics.currentLevel}</span>
          <span>{analytics.xpProgress.toFixed(1)}%</span>
          <span>Level {analytics.currentLevel + 1}</span>
        </div>
      </Card>
    );
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "primary" }: any) => (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 bg-${color}-100 rounded-lg`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </Card>
  );

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
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
              Learning Analytics
            </h1>
            <p className="text-gray-600">Track your progress and gain insights into your learning journey</p>
          </div>
        </div>

        {/* Level Progress - Prominent Display */}
        <div className="mb-8">
          <LevelProgressBar />
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
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={Clock}
                title="Total Study Time"
                value={`${analytics.totalStudyTime}h`}
                subtitle="All time"
                color="blue"
              />
              <StatCard
                icon={MessageSquare}
                title="Conversations"
                value={analytics.totalConversations}
                subtitle="Total sessions"
                color="green"
              />
              <StatCard
                icon={Calendar}
                title="Current Streak"
                value={`${analytics.currentStreak} days`}
                subtitle="Keep it up!"
                color="orange"
              />
              <StatCard
                icon={TrendingUp}
                title="Avg Session"
                value={`${analytics.averageSessionLength}min`}
                subtitle="Per conversation"
                color="purple"
              />
            </div>

            {/* Weekly Progress Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Weekly Study Progress</h3>
              <div className="flex items-end justify-between h-40 space-x-2">
                {analytics.weeklyProgress.map((minutes, index) => {
                  const maxMinutes = Math.max(...analytics.weeklyProgress, 1);
                  const height = (minutes / maxMinutes) * 100;
                  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                  const today = new Date().getDay();
                  const isToday = index === today;
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full flex flex-col items-center justify-end h-32">
                        <div
                          className={cn(
                            "w-full rounded-t-md transition-all duration-300 relative group",
                            isToday ? "bg-primary-600" : "bg-primary-400",
                            height < 5 ? "min-h-[4px]" : ""
                          )}
                          style={{ height: `${Math.max(5, height)}%` }}
                        >
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            {minutes.toFixed(1)} min
                          </div>
                        </div>
                      </div>
                      <span className={cn(
                        "text-xs mt-2 font-medium",
                        isToday ? "text-primary-600" : "text-gray-500"
                      )}>
                        {days[index]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Subject Breakdown and Recent Sessions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subject Breakdown */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Breakdown</h3>
                <div className="space-y-4">
                  {Object.entries(analytics.subjectBreakdown).length > 0 ? (
                    Object.entries(analytics.subjectBreakdown)
                      .sort(([, a], [, b]) => b - a) // Sort by time spent
                      .map(([subject, minutes]) => {
                        const totalMinutes = Object.values(analytics.subjectBreakdown).reduce((a, b) => a + b, 0);
                        const percentage = totalMinutes > 0 ? (minutes / totalMinutes) * 100 : 0;
                        
                        return (
                          <div key={subject}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium text-gray-700">{subject}</span>
                              <span className="text-gray-500">{minutes.toFixed(1)} min</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No subject data available yet. Start studying to see your breakdown!
                    </div>
                  )}
                </div>
              </Card>

              {/* Recent Sessions */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sessions</h3>
                <div className="space-y-3">
                  {analytics.recentSessions.length > 0 ? (
                    analytics.recentSessions.map((session, index) => (
                      <div key={session.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div>
                          <div className="font-medium text-gray-900">{session.subject}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(session.timestamp).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-primary-600">{session.duration} min</div>
                          <div className="text-sm text-gray-500">{session.messagesCount} messages</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No recent sessions found. Start studying to see your progress!
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Insights Component */}
            <AnalyticsInsights 
              totalStudyTime={analytics.totalStudyTime}
              totalConversations={analytics.totalConversations}
              averageSessionLength={analytics.averageSessionLength}
              currentStreak={analytics.currentStreak}
              totalXP={analytics.totalXP}
              weeklyProgress={analytics.weeklyProgress}
            />
          </div>
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