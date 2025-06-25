import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../store/store';
import { 
  Clock, 
  MessageSquare, 
  Calendar,
  Award,
  Trophy
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format, subDays } from 'date-fns';
import { 
  AreaChart, Area, BarChart, Bar, ResponsiveContainer,
  CartesianGrid, XAxis, YAxis, Tooltip
} from 'recharts';

interface AnalyticsData {
  totalStudyTime: number; // in minutes
  totalConversations: number;
  currentStreak: number;
  totalXP: number;
  currentLevel: number;
  xpProgress: number; // percentage to next level
  weeklyXP: Array<{ day: string; xp: number }>;
  subjectBreakdown: Array<{ subject: string; count: number; time: number }>;
  dailyActivity: Array<{ date: string; conversations: number; time: number }>;
  achievements: Array<{ id: string; title: string; description: string; unlockedAt: Date }>;
}

export const LearningAnalytics: React.FC = () => {
  const { user } = useAuth();
  const { updateSocialStats } = useStore();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalStudyTime: 0,
    totalConversations: 0,
    currentStreak: 0,
    totalXP: 0,
    currentLevel: 1,
    xpProgress: 0,
    weeklyXP: [],
    subjectBreakdown: [],
    dailyActivity: [],
    achievements: []
  });

  useEffect(() => {
    if (user) {
      loadAnalyticsData();
    }
  }, [user]);

  const loadAnalyticsData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch conversations
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });

      if (convError) throw convError;

      // Calculate basic stats
      const totalConversations = conversations?.length || 0;
      const totalStudyTime = conversations?.reduce((sum, conv) => {
        return sum + (conv.duration || 60); // Default 1 minute per conversation
      }, 0) || 0;

      // Calculate XP and level
      const baseXP = totalConversations * 10; // 10 XP per conversation
      const bonusXP = Math.floor(totalStudyTime / 300) * 5; // 5 XP per 5 minutes of study
      const totalXP = baseXP + bonusXP;

      // Level calculation: Level 1 = 0-99 XP, Level 2 = 100-299 XP, etc.
      const currentLevel = Math.floor(totalXP / 100) + 1;
      const xpInCurrentLevel = totalXP % 100;
      const xpProgress = xpInCurrentLevel;

      // Calculate streak
      const currentStreak = calculateStreak(conversations || []);

      // Generate weekly XP data
      const weeklyXP = generateWeeklyXP(conversations || []);

      // Calculate subject breakdown
      const subjectBreakdown = calculateSubjectBreakdown(conversations || []);

      // Generate daily activity
      const dailyActivity = generateDailyActivity(conversations || []);

      // Generate achievements based on stats
      const achievements = generateAchievements(totalConversations, currentStreak, currentLevel, totalStudyTime);

      const analyticsData: AnalyticsData = {
        totalStudyTime: Math.round(totalStudyTime / 60), // Convert to hours
        totalConversations,
        currentStreak,
        totalXP,
        currentLevel,
        xpProgress,
        weeklyXP,
        subjectBreakdown,
        dailyActivity,
        achievements
      };

      setAnalytics(analyticsData);

      // Update store with real data
      updateSocialStats({
        totalXP,
        level: currentLevel,
        streak: { current: currentStreak, longest: currentStreak, lastStudyDate: new Date() },
        achievements
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (conversations: any[]): number => {
    if (!conversations.length) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Group conversations by date
    const conversationDates = new Set(
      conversations.map(conv => {
        const date = new Date(conv.timestamp);
        date.setHours(0, 0, 0, 0);
        return date.toISOString().split('T')[0];
      })
    );
    
    // Check consecutive days backwards from today
    let currentDate = new Date(today);
    
    // Check if user studied today or yesterday
    const todayStr = currentDate.toISOString().split('T')[0];
    if (!conversationDates.has(todayStr)) {
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    // Count consecutive days
    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      if (conversationDates.has(dateStr)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  const generateWeeklyXP = (conversations: any[]) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStr = format(date, 'yyyy-MM-dd');
      
      const dayConversations = conversations.filter(conv => 
        format(new Date(conv.timestamp), 'yyyy-MM-dd') === dayStr
      );
      
      const xp = dayConversations.length * 10 + Math.floor(dayConversations.reduce((sum, conv) => sum + (conv.duration || 60), 0) / 300) * 5;
      
      weeklyData.push({
        day: days[date.getDay()],
        xp
      });
    }
    
    return weeklyData;
  };

  const calculateSubjectBreakdown = (conversations: any[]) => {
    const subjects: Record<string, { count: number; time: number }> = {};
    
    conversations.forEach(conv => {
      const text = (conv.user_message + ' ' + conv.ai_response).toLowerCase();
      let subject = 'General';
      
      if (text.includes('math') || text.includes('algebra') || text.includes('calculus')) {
        subject = 'Math';
      } else if (text.includes('science') || text.includes('physics') || text.includes('chemistry')) {
        subject = 'Science';
      } else if (text.includes('english') || text.includes('literature') || text.includes('writing')) {
        subject = 'English';
      } else if (text.includes('history')) {
        subject = 'History';
      } else if (text.includes('language') || text.includes('spanish') || text.includes('french')) {
        subject = 'Languages';
      }
      
      if (!subjects[subject]) {
        subjects[subject] = { count: 0, time: 0 };
      }
      
      subjects[subject].count++;
      subjects[subject].time += conv.duration || 60;
    });
    
    return Object.entries(subjects).map(([subject, { count, time }]) => ({
      subject,
      count,
      time: Math.round(time / 60) // Convert to minutes
    })).sort((a, b) => b.count - a.count);
  };

  const generateDailyActivity = (conversations: any[]) => {
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const dayConversations = conversations.filter(conv => 
        format(new Date(conv.timestamp), 'yyyy-MM-dd') === dateStr
      );
      
      last7Days.push({
        date: format(date, 'MMM dd'),
        conversations: dayConversations.length,
        time: Math.round(dayConversations.reduce((sum, conv) => sum + (conv.duration || 60), 0) / 60)
      });
    }
    
    return last7Days;
  };

  const generateAchievements = (conversations: number, streak: number, level: number, studyTime: number) => {
    const achievements = [];
    
    if (conversations >= 1) {
      achievements.push({
        id: 'first-chat',
        title: 'First Steps',
        description: 'Completed your first conversation',
        unlockedAt: new Date(),
        icon: 'default-icon',
      });
    }
    
    if (conversations >= 10) {
      achievements.push({
        id: 'dedicated-learner',
        title: 'Dedicated Learner',
        description: 'Completed 10 learning conversations',
        unlockedAt: new Date(),
        icon: 'default-icon',
      });
    }
    
    if (streak >= 3) {
      achievements.push({
        id: 'streak-3',
        title: 'Building Momentum',
        description: '3-day learning streak',
        unlockedAt: new Date(),
        icon: 'default-icon',
      });
    }
    
    if (streak >= 7) {
      achievements.push({
        id: 'streak-7',
        title: 'Week Warrior',
        description: '7-day learning streak',
        unlockedAt: new Date(),
        icon: 'default-icon',
      });
    }
    
    if (level >= 5) {
      achievements.push({
        id: 'level-5',
        title: 'Rising Scholar',
        description: 'Reached Level 5',
        unlockedAt: new Date(),
        icon: 'default-icon',
      });
    }
    
    if (studyTime >= 60) { // 1 hour
      achievements.push({
        id: 'hour-milestone',
        title: 'Time Investment',
        description: 'Studied for over 1 hour total',
        unlockedAt: new Date(),
        icon: 'default-icon',
      });
    }
    
    return achievements;
  };

  const LevelProgressBar = () => (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Level Progress</h3>
          <p className="text-sm text-gray-600">Level {analytics.currentLevel}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary-600">{analytics.totalXP} XP</div>
          <p className="text-sm text-gray-600">{100 - analytics.xpProgress} XP to next level</p>
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-primary-500 to-primary-600 h-4 rounded-full transition-all duration-1000 ease-out relative"
          style={{ width: `${Math.max(5, analytics.xpProgress)}%` }}
        >
          <div className="absolute inset-0 bg-white opacity-20 rounded-full animate-pulse"></div>
        </div>
      </div>
      
      <div className="flex justify-between text-xs text-gray-500">
        <span>Level {analytics.currentLevel}</span>
        <span>{analytics.xpProgress}%</span>
        <span>Level {analytics.currentLevel + 1}</span>
      </div>
    </Card>
  );

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
            <p className="text-gray-600">Track your progress and learning journey</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={loadAnalyticsData}>
              Refresh Data
            </Button>
            <Button variant="primary" onClick={() => window.location.href = '/study'}>
              Continue Learning
            </Button>
          </div>
        </div>

        {/* Level Progress */}
        <div className="mb-8">
          <LevelProgressBar />
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
            icon={Trophy}
            title="Achievements"
            value={analytics.achievements.length}
            subtitle="Unlocked"
            color="purple"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Weekly XP Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly XP Progress</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.weeklyXP}>
                  <defs>
                    <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`${value} XP`, 'XP Earned']} />
                  <Area
                    type="monotone"
                    dataKey="xp"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#xpGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Daily Activity */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Activity</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="conversations" fill="#10B981" name="Conversations" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Subject Breakdown and Achievements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subject Breakdown */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Breakdown</h3>
            <div className="space-y-4">
              {analytics.subjectBreakdown.map((subject) => (
                <div key={subject.subject}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{subject.subject}</span>
                    <span className="text-gray-500">{subject.count} sessions</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.max(5, (subject.count / Math.max(1, analytics.totalConversations)) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Achievements */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Achievements</h3>
            <div className="space-y-3">
              {analytics.achievements.length > 0 ? (
                analytics.achievements.slice(0, 5).map((achievement) => (
                  <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="p-2 bg-yellow-100 rounded-full">
                      <Award className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Start learning to unlock achievements!
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};