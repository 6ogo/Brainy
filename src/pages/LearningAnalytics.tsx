import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { cn, commonStyles } from '../styles/utils';
import { useStore } from '../store/store';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Line, Doughnut, Bar, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { 
  Brain, 
  Clock, 
  Target, 
  TrendingUp, 
  Download,
  Calendar, 
  Award, 
  BookOpen, 
  ChevronDown,
  Users,
  Zap,
  Trophy,
  Flame
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ConversationData {
  id: string;
  user_message: string;
  ai_response: string;
  duration: number;
  timestamp: string;
  summary?: string;
}

interface UserUsageData {
  id: string;
  user_id: string;
  date: string;
  conversation_minutes: number;
  video_call_minutes: number;
  updated_at: string;
}

interface AnalyticsCache {
  conversations: ConversationData[];
  usage: UserUsageData[];
  lastUpdated: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = 'learning_analytics_cache';

export const LearningAnalytics: React.FC = () => {
  const { socialStats, currentSubject } = useStore();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [usageData, setUsageData] = useState<UserUsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [showExport, setShowExport] = useState(false);

  // Cache management
  const getCachedData = (): AnalyticsCache | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      
      const data = JSON.parse(cached) as AnalyticsCache;
      const isExpired = Date.now() - data.lastUpdated > CACHE_DURATION;
      
      if (isExpired) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      
      return data;
    } catch {
      return null;
    }
  };

  const setCachedData = (data: AnalyticsCache) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to cache analytics data:', error);
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to get cached data first
        const cachedData = getCachedData();
        if (cachedData) {
          setConversations(cachedData.conversations);
          setUsageData(cachedData.usage);
          setLoading(false);
          return;
        }

        // Fetch conversations
        const { data: conversationData, error: conversationError } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false })
          .limit(100);

        if (conversationError) {
          throw new Error(`Failed to fetch conversations: ${conversationError.message}`);
        }

        // Fetch usage data
        const { data: usageDataResult, error: usageError } = await supabase
          .from('user_usage')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(30);

        if (usageError) {
          throw new Error(`Failed to fetch usage data: ${usageError.message}`);
        }

        const conversations = conversationData || [];
        const usage = usageDataResult || [];

        setConversations(conversations);
        setUsageData(usage);

        // Cache the data
        setCachedData({
          conversations,
          usage,
          lastUpdated: Date.now()
        });

      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [user]);

  // Calculate analytics metrics
  const totalConversations = conversations.length;
  const totalStudyMinutes = usageData.reduce((sum, day) => 
    sum + (day.conversation_minutes || 0) + (day.video_call_minutes || 0), 0);
  const totalStudyHours = Math.round(totalStudyMinutes / 60 * 10) / 10;
  const averageSessionLength = totalConversations > 0 
    ? Math.round(conversations.reduce((sum, conv) => sum + (conv.duration || 0), 0) / totalConversations / 60)
    : 0;

  // Prepare chart data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), i);
    return format(date, 'yyyy-MM-dd');
  }).reverse();

  const dailyActivityData = {
    labels: last7Days.map(date => format(new Date(date), 'EEE')),
    datasets: [
      {
        label: 'Study Minutes',
        data: last7Days.map(date => {
          const dayUsage = usageData.find(u => u.date === date);
          return (dayUsage?.conversation_minutes || 0) + (dayUsage?.video_call_minutes || 0);
        }),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const conversationTypesData = {
    labels: ['Text Conversations', 'Voice Sessions'],
    datasets: [
      {
        data: [
          usageData.reduce((sum, day) => sum + (day.conversation_minutes || 0), 0),
          usageData.reduce((sum, day) => sum + (day.video_call_minutes || 0), 0),
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const weeklyProgressData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'XP Earned',
        data: [120, 190, 300, socialStats.totalXP % 100],
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
      },
    ],
  };

  const skillsRadarData = {
    labels: ['Problem Solving', 'Critical Thinking', 'Memory', 'Speed', 'Comprehension'],
    datasets: [
      {
        label: 'Skills',
        data: [85, 78, 92, 65, 88],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
      },
    ],
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Learning Analytics Report', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Generated on ${format(new Date(), 'PPP')}`, 20, 30);
    doc.text(`Student: ${user?.full_name || 'Student'}`, 20, 40);
    
    // Stats
    doc.setFontSize(14);
    doc.text('Learning Statistics', 20, 60);
    
    doc.setFontSize(10);
    doc.text(`Total Conversations: ${totalConversations}`, 20, 75);
    doc.text(`Total Study Time: ${totalStudyHours} hours`, 20, 85);
    doc.text(`Current XP: ${socialStats.totalXP}`, 20, 95);
    doc.text(`Current Streak: ${socialStats.streak.current} days`, 20, 105);
    doc.text(`Average Session: ${averageSessionLength} minutes`, 20, 115);
    
    // Recent activity
    doc.text('Recent Activity Summary', 20, 135);
    const recentConversations = conversations.slice(0, 5);
    recentConversations.forEach((conv, index) => {
      const y = 150 + (index * 10);
      doc.text(`${format(new Date(conv.timestamp), 'MM/dd')} - ${Math.round(conv.duration / 60)}min`, 20, y);
    });
    
    doc.save('learning-analytics.pdf');
  };

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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="p-6 bg-red-50 border border-red-200">
            <div className="flex items-center space-x-2 mb-4">
              <Target className="h-5 w-5 text-red-600" />
              <h3 className="text-lg font-semibold text-red-800">Unable to Load Analytics</h3>
            </div>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Try Again
            </button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={cn(commonStyles.heading.h1, "mb-2")}>
              Learning Analytics
            </h1>
            <p className="text-gray-600">Track your progress and insights</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setSelectedTimeframe(prev => prev === 'week' ? 'month' : 'week')}
                className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
              >
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium capitalize">{selectedTimeframe}</span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowExport(!showExport)}
                className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
              >
                <Download className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Export</span>
              </button>
              
              {showExport && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  <button
                    onClick={exportToPDF}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Download PDF Report
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Conversations</p>
                <p className="text-2xl font-bold text-gray-900">{totalConversations}</p>
                <p className="text-xs text-green-600">+{Math.floor(totalConversations * 0.1)} this week</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-full">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Study Time</p>
                <p className="text-2xl font-bold text-gray-900">{totalStudyHours}h</p>
                <p className="text-xs text-gray-500">{averageSessionLength} min avg</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 rounded-full">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total XP</p>
                <p className="text-2xl font-bold text-gray-900">{socialStats.totalXP}</p>
                <p className="text-xs text-gray-500">Level {socialStats.level}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-orange-100 rounded-full">
                <Flame className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900">{socialStats.streak.current}</p>
                <p className="text-xs text-gray-500">Best: {socialStats.streak.longest} days</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Daily Activity */}
          <Card className="p-6">
            <h3 className={cn(commonStyles.heading.h3, "mb-4")}>Daily Activity</h3>
            <div className="h-64">
              <Line 
                data={dailyActivityData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return value + ' min';
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </Card>
          
          {/* Conversation Types */}
          <Card className="p-6">
            <h3 className={cn(commonStyles.heading.h3, "mb-4")}>Learning Methods</h3>
            <div className="h-64">
              <Doughnut 
                data={conversationTypesData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
              />
            </div>
          </Card>
        </div>

        {/* Additional Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Weekly Progress */}
          <Card className="p-6">
            <h3 className={cn(commonStyles.heading.h3, "mb-4")}>Weekly XP Progress</h3>
            <div className="h-64">
              <Bar 
                data={weeklyProgressData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    }
                  }
                }}
              />
            </div>
          </Card>
          
          {/* Skills Radar */}
          <Card className="p-6">
            <h3 className={cn(commonStyles.heading.h3, "mb-4")}>Skills Assessment</h3>
            <div className="h-64">
              <Radar 
                data={skillsRadarData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    r: {
                      beginAtZero: true,
                      max: 100,
                    }
                  }
                }}
              />
            </div>
          </Card>
        </div>

        {/* Achievements & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Achievements */}
          <Card className="p-6">
            <h3 className={cn(commonStyles.heading.h3, "mb-4")}>Recent Achievements</h3>
            {socialStats.achievements.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Keep learning to unlock achievements!
              </p>
            ) : (
              <div className="space-y-3">
                {socialStats.achievements.slice(0, 5).map((achievement) => (
                  <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-yellow-100 rounded-full">
                      <Trophy className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                      <p className="text-sm text-gray-500">{achievement.description}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {achievement.unlockedAt && format(achievement.unlockedAt, 'MMM dd')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Sessions */}
          <Card className="p-6">
            <h3 className={cn(commonStyles.heading.h3, "mb-4")}>Recent Sessions</h3>
            {conversations.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Start learning to see your session history!
              </p>
            ) : (
              <div className="space-y-3">
                {conversations.slice(0, 5).map((conversation) => (
                  <div key={conversation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conversation.user_message.substring(0, 50)}...
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(conversation.timestamp), 'MMM dd, h:mm a')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">
                        {Math.round(conversation.duration / 60)} min
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Learning Insights */}
        <Card className="p-6">
          <h3 className={cn(commonStyles.heading.h3, "mb-4")}>Learning Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="p-4 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <Target className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Consistency</h4>
              <p className="text-sm text-gray-600">
                You've been studying consistently for {socialStats.streak.current} days. 
                Keep it up to build lasting knowledge!
              </p>
            </div>
            
            <div className="text-center">
              <div className="p-4 bg-green-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Progress</h4>
              <p className="text-sm text-gray-600">
                Your learning velocity is {(socialStats.totalXP / Math.max(totalStudyMinutes, 1) * 60).toFixed(1)} XP/hour. 
                You're making great progress!
              </p>
            </div>
            
            <div className="text-center">
              <div className="p-4 bg-purple-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <Brain className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Engagement</h4>
              <p className="text-sm text-gray-600">
                Average session length of {averageSessionLength} minutes shows 
                you're deeply engaged with the material.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};