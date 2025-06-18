import React, { useState, useEffect } from 'react';
import { useStore } from '../store/store';
import { format, subDays } from 'date-fns';
import { 
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { 
  Brain, Clock, Target, TrendingUp, Download,
  Calendar, Award, BookOpen, ChevronDown, Zap,
  AlertCircle, CheckCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './Button';
import { Card } from './Card';
import { cn } from '../styles/utils';
import toast from 'react-hot-toast';

export const AnalyticsDashboard: React.FC = () => {
  const { sessionStats, socialStats, currentSubject } = useStore();
  const { user } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [showExport, setShowExport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>({
    learningVelocity: 0,
    engagementScore: 0,
    consistencyRating: '',
    progressTrend: '',
    timeToNextLevel: 0,
    levelProgress: 0,
    weeklyXP: [],
    subjectDistribution: {},
    skillsData: []
  });

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

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
        const { data: usageData, error: usageError } = await supabase
          .from('user_usage')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(30);

        if (usageError) {
          throw new Error(`Failed to fetch usage data: ${usageError.message}`);
        }

        // Calculate learning velocity (XP per hour)
        const totalStudyTime = usageData?.reduce((sum, day) => 
          sum + (day.conversation_minutes || 0) + (day.video_call_minutes || 0), 0) || 0;
        
        const learningVelocity = totalStudyTime > 0 
          ? Math.round((socialStats.totalXP / totalStudyTime) * 60) 
          : 0;

        // Calculate engagement score
        const activeStudyTime = conversationData?.reduce((sum, conv) => sum + (conv.duration || 0), 0) || 0;
        const totalLoggedTime = totalStudyTime * 60; // convert to seconds
        const engagementScore = totalLoggedTime > 0 
          ? Math.min(100, Math.round((activeStudyTime / totalLoggedTime) * 100)) 
          : 0;

        // Calculate consistency rating
        const consistencyRating = socialStats.streak.current >= 7 
          ? 'Excellent' 
          : socialStats.streak.current >= 3 
            ? 'Good' 
            : 'Building';

        // Calculate weekly XP data
        const weeklyXP = Array.from({ length: 7 }, (_, i) => {
          const date = subDays(new Date(), i);
          const dateStr = format(date, 'yyyy-MM-dd');
          
          // Find conversations from this day
          const dayConversations = conversationData?.filter(conv => 
            format(new Date(conv.timestamp), 'yyyy-MM-dd') === dateStr
          ) || [];
          
          // Estimate XP (10 per conversation)
          const xp = dayConversations.length * 10;
          
          return {
            day: format(date, 'EEE'),
            xp
          };
        }).reverse();

        // Calculate progress trend
        const recentXP = weeklyXP.slice(-2).map(day => day.xp);
        const progressTrend = recentXP.length >= 2 && recentXP[1] > recentXP[0]
          ? 'Improving'
          : 'Steady';

        // Calculate time to next level
        const currentXP = socialStats.totalXP;
        const nextLevelXP = (socialStats.level + 1) * 1000;
        const xpNeeded = nextLevelXP - currentXP;
        const timeToNextLevel = learningVelocity > 0 
          ? Math.ceil(xpNeeded / learningVelocity) 
          : 0;
        
        // Calculate level progress percentage
        const levelProgress = ((currentXP % 1000) / 1000) * 100;

        // Generate subject distribution
        const subjectDistribution = generateSubjectDistribution(conversationData || []);

        // Generate skills data
        const skillsData = generateSkillsData(conversationData || []);

        setAnalyticsData({
          learningVelocity,
          engagementScore,
          consistencyRating,
          progressTrend,
          timeToNextLevel,
          levelProgress,
          weeklyXP,
          subjectDistribution,
          skillsData
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
        setLoading(false);
      }
    };

    fetchAnalyticsData();

    // Set up interval to update learning velocity every 60 minutes
    const velocityInterval = setInterval(() => {
      setAnalyticsData((prevData: any) => ({
        ...prevData,
        learningVelocity: calculateLearningVelocity()
      }));
    }, 60 * 60 * 1000);

    return () => clearInterval(velocityInterval);
  }, [user, socialStats.totalXP, socialStats.level, socialStats.streak.current]);

  // Generate subject distribution
  const generateSubjectDistribution = (conversations: any[]) => {
    const subjects: Record<string, number> = {
      'Math': 0,
      'Science': 0,
      'English': 0,
      'History': 0,
      'Languages': 0,
      'Test Prep': 0
    };
    
    conversations.forEach(conv => {
      const text = conv.user_message.toLowerCase();
      if (text.includes('math')) subjects['Math']++;
      else if (text.includes('science') || text.includes('physics') || text.includes('chemistry')) subjects['Science']++;
      else if (text.includes('english') || text.includes('literature')) subjects['English']++;
      else if (text.includes('history')) subjects['History']++;
      else if (text.includes('language') || text.includes('spanish') || text.includes('french')) subjects['Languages']++;
      else if (text.includes('test') || text.includes('exam')) subjects['Test Prep']++;
      else subjects['Math']++; // Default to Math if no subject detected
    });
    
    return subjects;
  };

  // Generate skills data
  const generateSkillsData = (conversations: any[]) => {
    const skills = [
      { skill: 'Problem Solving', value: 0 },
      { skill: 'Critical Thinking', value: 0 },
      { skill: 'Memory', value: 0 },
      { skill: 'Speed', value: 0 },
      { skill: 'Comprehension', value: 0 }
    ];
    
    conversations.forEach(conv => {
      const text = (conv.user_message + ' ' + conv.ai_response).toLowerCase();
      
      // Problem Solving
      if (text.includes('problem') || text.includes('solve') || text.includes('solution')) {
        skills[0].value += 1;
      }
      
      // Critical Thinking
      if (text.includes('why') || text.includes('analyze') || text.includes('evaluate')) {
        skills[1].value += 1;
      }
      
      // Memory
      if (text.includes('remember') || text.includes('recall') || text.includes('memorize')) {
        skills[2].value += 1;
      }
      
      // Speed
      if (text.includes('quick') || text.includes('fast') || text.includes('speed')) {
        skills[3].value += 1;
      }
      
      // Comprehension
      if (text.includes('understand') || text.includes('comprehend') || text.includes('meaning')) {
        skills[4].value += 1;
      }
    });
    
    // Normalize values to 0-100 scale
    const maxValue = Math.max(...skills.map(s => s.value), 1);
    return skills.map(skill => ({
      ...skill,
      value: Math.min(100, Math.round((skill.value / maxValue) * 80) + 20) // Ensure minimum of 20
    }));
  };

  // Calculate learning velocity
  const calculateLearningVelocity = () => {
    const studyTime = sessionStats.duration / 60; // Convert to minutes
    return studyTime > 0 ? Math.round((socialStats.totalXP / studyTime) * 60) : 0; // XP per hour
  };

  // Export analytics to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Learning Analytics Report', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Generated on ${format(new Date(), 'PPP')}`, 20, 30);
    doc.text(`Student: ${user?.full_name || 'Student'}`, 20, 40);
    doc.text(`Subject: ${currentSubject}`, 20, 50);
    
    // Stats
    doc.setFontSize(14);
    doc.text('Learning Statistics', 20, 70);
    
    doc.setFontSize(10);
    doc.text(`Current Level: ${socialStats.level}`, 20, 85);
    doc.text(`Total XP: ${socialStats.totalXP}`, 20, 95);
    doc.text(`Learning Velocity: ${analyticsData.learningVelocity} XP/hour`, 20, 105);
    doc.text(`Engagement Score: ${analyticsData.engagementScore}%`, 20, 115);
    doc.text(`Consistency Rating: ${analyticsData.consistencyRating}`, 20, 125);
    doc.text(`Current Streak: ${socialStats.streak.current} days`, 20, 135);
    doc.text(`Progress Trend: ${analyticsData.progressTrend}`, 20, 145);
    
    // Level progress
    doc.text('Level Progress', 20, 165);
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(59, 130, 246);
    doc.rect(20, 170, 100, 10, 'S');
    doc.rect(20, 170, analyticsData.levelProgress, 10, 'F');
    doc.text(`${Math.round(analyticsData.levelProgress)}% to Level ${socialStats.level + 1}`, 125, 177);
    
    // Achievements
    doc.text('Recent Achievements', 20, 195);
    socialStats.achievements.slice(0, 3).forEach((achievement, index) => {
      const y = 205 + (index * 10);
      doc.text(`• ${achievement.title}: ${achievement.description}`, 25, y);
    });
    
    // Save the PDF
    doc.save('learning-analytics.pdf');
    toast.success('Analytics report downloaded successfully!');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">Learning Analytics</h2>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">Learning Analytics</h2>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </p>
          <Button 
            variant="outline" 
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Learning Analytics</h2>
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

      {/* Level Progress */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
        <div className="flex flex-col md:flex-row items-center justify-between mb-4">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="p-3 bg-blue-100 rounded-full mr-4">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Level {socialStats.level}</h3>
              <p className="text-sm text-gray-600">{socialStats.totalXP} XP total</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">Next Level</p>
              <p className="text-lg font-bold text-gray-900">Level {socialStats.level + 1}</p>
            </div>
            <div className="p-2 bg-indigo-100 rounded-full">
              <Award className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{socialStats.totalXP % 1000} XP</span>
            <span>{(socialStats.level + 1) * 1000} XP</span>
          </div>
          <div className="h-3 bg-blue-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${analyticsData.levelProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{Math.round(analyticsData.levelProgress)}% complete</span>
            <span>
              {analyticsData.timeToNextLevel > 0 
                ? `~${analyticsData.timeToNextLevel} hours to next level` 
                : 'Keep studying to level up!'}
            </span>
          </div>
        </div>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-primary-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-full">
              <Brain className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-primary-600">Learning Velocity</p>
              <p className="text-2xl font-semibold text-primary-700">
                {analyticsData.learningVelocity} XP/hr
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-full">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-600">Engagement Score</p>
              <p className="text-2xl font-semibold text-green-700">
                {analyticsData.engagementScore}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-full">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-purple-600">Consistency Rating</p>
              <p className="text-2xl font-semibold text-purple-700">
                {analyticsData.consistencyRating}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-full">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-orange-600">Progress Trend</p>
              <p className="text-2xl font-semibold text-orange-700">
                {analyticsData.progressTrend}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly XP Chart */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Weekly XP Progress</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analyticsData.weeklyXP}>
              <defs>
                <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} XP`, 'XP Earned']} />
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
      </div>

      {/* Subject Progress and Skills Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Subject Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Object.entries(analyticsData.subjectDistribution).map(([subject, count]) => ({ subject, count }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} sessions`, 'Sessions']} />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Skills Analysis</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={analyticsData.skillsData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="skill" />
                <PolarRadiusAxis />
                <Radar
                  name="Skills"
                  dataKey="value"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Milestone Achievements */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Level Milestone Achievements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { level: 5, title: "Knowledge Seeker", icon: <BookOpen className="h-5 w-5" />, color: "bg-blue-100 text-blue-600" },
            { level: 10, title: "Dedicated Scholar", icon: <Award className="h-5 w-5" />, color: "bg-green-100 text-green-600" },
            { level: 15, title: "Learning Expert", icon: <Target className="h-5 w-5" />, color: "bg-purple-100 text-purple-600" },
            { level: 20, title: "Wisdom Master", icon: <Brain className="h-5 w-5" />, color: "bg-amber-100 text-amber-600" }
          ].map((achievement) => (
            <Card 
              key={achievement.level} 
              className={cn(
                "p-4 border",
                socialStats.level >= achievement.level 
                  ? "border-green-200 bg-green-50" 
                  : "border-gray-200 bg-gray-50 opacity-60"
              )}
            >
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "p-2 rounded-full",
                  socialStats.level >= achievement.level ? achievement.color : "bg-gray-100 text-gray-400"
                )}>
                  {achievement.icon}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                  <p className="text-xs text-gray-500">Level {achievement.level}</p>
                  {socialStats.level >= achievement.level && (
                    <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Unlocked
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-2">
          <Button
            variant="outline"
            onClick={() => {
              const achievementsSection = document.getElementById('achievements-section');
              if (achievementsSection) {
                achievementsSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            View All Achievements
          </Button>
        </div>
      </div>

      {/* Study Advisor Eligibility */}
      <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div className="flex items-start space-x-4 mb-4 md:mb-0">
            <div className="p-3 bg-indigo-100 rounded-full">
              <Brain className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Study Advisor</h3>
              <p className="text-sm text-gray-600 max-w-md">
                Get personalized study recommendations based on your learning patterns and performance metrics.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <div className="flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full" 
                  style={{ width: `${Math.min(100, (sessionStats.messagesCount / 10) * 20)}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-gray-600">
                {Math.min(5, Math.floor(sessionStats.messagesCount / 10))}/5 sessions
              </span>
            </div>
            
            <Button
              variant={sessionStats.messagesCount >= 50 ? "primary" : "outline"}
              size="sm"
              disabled={sessionStats.messagesCount < 50}
              onClick={() => {
                if (sessionStats.messagesCount >= 50) {
                  window.location.href = '/study-advisor';
                } else {
                  toast.error('Complete at least 5 study sessions to unlock this feature');
                }
              }}
            >
              {sessionStats.messagesCount >= 50 ? "View Personalized Advice" : "Complete More Sessions to Unlock"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};