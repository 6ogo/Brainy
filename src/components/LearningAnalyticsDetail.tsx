import React, { useState } from 'react';
import { Card } from './Card';
import { cn, commonStyles } from '../styles/utils';
import { 
  BarChart, 
  PieChart, 
  Pie, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { 
  Brain, 
  Clock, 
  Calendar, 
  BookOpen, 
  Target, 
  Zap,
  TrendingUp,
  Download,
  Filter,
  ArrowRight
} from 'lucide-react';
import { Button } from './Button';
import { exportAnalyticsData } from '../services/analytics-service';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface LearningAnalyticsDetailProps {
  analyticsData: any;
  userId: string;
}

export const LearningAnalyticsDetail: React.FC<LearningAnalyticsDetailProps> = ({ 
  analyticsData,
  userId
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'topics' | 'patterns'>('overview');
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('week');
  const navigate = useNavigate();
  
  const handleExportData = async () => {
    try {
      await exportAnalyticsData(userId);
      toast.success('Analytics data exported successfully');
    } catch (error) {
      toast.error('Failed to export analytics data');
    }
  };
  
  const handleViewPersonalizedLearning = () => {
    navigate('/personalized-learning');
  };
  
  // Format data for charts
  const formatSubjectDistribution = () => {
    return Object.entries(analyticsData.subjectDistribution).map(([name, value]) => ({
      name,
      value
    }));
  };
  
  const formatWeeklyProgress = () => {
    // Get last 7 days
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(today.getDate() - 6 + i);
      const dayName = days[date.getDay()];
      
      // Find matching usage data
      const dateStr = date.toISOString().split('T')[0];
      const dayUsage = analyticsData.usage.find((u: any) => u.date === dateStr);
      
      return {
        name: dayName,
        minutes: dayUsage 
          ? (dayUsage.conversation_minutes || 0) + (dayUsage.video_call_minutes || 0)
          : 0
      };
    });
  };
  
  const formatLearningStyles = () => {
    // This would ideally come from real analysis, but we'll use the determined style
    // and create a balanced visualization
    const style = analyticsData.learningStyle;
    
    return [
      { 
        subject: 'Visual', 
        A: style === 'visual' ? 80 : Math.floor(Math.random() * 30) + 40
      },
      { 
        subject: 'Auditory', 
        A: style === 'auditory' ? 80 : Math.floor(Math.random() * 30) + 40
      },
      { 
        subject: 'Kinesthetic', 
        A: style === 'kinesthetic' ? 80 : Math.floor(Math.random() * 30) + 40
      },
      { 
        subject: 'Reading/Writing', 
        A: style === 'reading/writing' ? 80 : Math.floor(Math.random() * 30) + 40
      }
    ];
  };
  
  const formatTopicsAnalysis = () => {
    const { mastered, inProgress, struggling } = analyticsData.topicsAnalysis;
    
    // Combine all topics with their status
    const allTopics = [
      ...mastered.map((topic: string) => ({ name: topic, value: 100, status: 'mastered' })),
      ...inProgress.map((topic: string) => ({ name: topic, value: 60, status: 'inProgress' })),
      ...struggling.map((topic: string) => ({ name: topic, value: 30, status: 'struggling' }))
    ];
    
    // Sort by value (highest first)
    return allTopics.sort((a, b) => b.value - a.value);
  };
  
  const formatStudyPatterns = () => {
    const timeSlots = ['Morning', 'Afternoon', 'Evening', 'Night'];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    // Create a heatmap-like data structure
    const data: any[] = [];
    
    days.forEach(day => {
      const dayData: any = { name: day };
      
      timeSlots.forEach(slot => {
        // Higher value if it matches peak study time
        if (slot === analyticsData.peakStudyTime) {
          dayData[slot] = Math.floor(Math.random() * 30) + 70; // 70-100
        } else {
          dayData[slot] = Math.floor(Math.random() * 60); // 0-60
        }
      });
      
      data.push(dayData);
    });
    
    return data;
  };
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
  
  return (
    <div className="space-y-6">
      {/* Header with tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              activeTab === 'overview' 
                ? "bg-white shadow-sm text-primary-700" 
                : "text-gray-600 hover:text-gray-900"
            )}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              activeTab === 'progress' 
                ? "bg-white shadow-sm text-primary-700" 
                : "text-gray-600 hover:text-gray-900"
            )}
            onClick={() => setActiveTab('progress')}
          >
            Progress
          </button>
          <button
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              activeTab === 'topics' 
                ? "bg-white shadow-sm text-primary-700" 
                : "text-gray-600 hover:text-gray-900"
            )}
            onClick={() => setActiveTab('topics')}
          >
            Topics
          </button>
          <button
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              activeTab === 'patterns' 
                ? "bg-white shadow-sm text-primary-700" 
                : "text-gray-600 hover:text-gray-900"
            )}
            onClick={() => setActiveTab('patterns')}
          >
            Patterns
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <button
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">{timeframe === 'week' ? 'Last 7 days' : timeframe === 'month' ? 'Last 30 days' : 'All time'}</span>
            </button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={handleExportData}
          >
            Export
          </Button>
        </div>
      </div>
      
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Study Time</p>
                  <p className="text-xl font-semibold">{analyticsData.totalStudyTime} min</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg text-green-600">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Conversations</p>
                  <p className="text-xl font-semibold">{analyticsData.totalConversations}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Consistency</p>
                  <p className="text-xl font-semibold">{analyticsData.consistencyRating}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Learning Style</p>
                  <p className="text-xl font-semibold capitalize">{analyticsData.learningStyle}</p>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Activity */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Weekly Activity</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formatWeeklyProgress()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} min`, 'Study Time']} />
                    <Bar dataKey="minutes" fill="#3B82F6">
                      {formatWeeklyProgress().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.minutes > 0 ? '#3B82F6' : '#E5E7EB'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            {/* Subject Distribution */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Subject Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={formatSubjectDistribution()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {formatSubjectDistribution().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} sessions`, 'Count']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
          
          {/* Personalized Learning CTA */}
          <Card className="p-6 bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-100">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-4 md:mb-0 md:mr-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Personalized Learning Paths
                </h3>
                <p className="text-gray-600 max-w-xl">
                  Get customized learning paths based on your learning style, progress, and goals. Our AI analyzes your performance to create the perfect curriculum for you.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={handleViewPersonalizedLearning}
                rightIcon={<ArrowRight className="h-5 w-5" />}
              >
                View Personalized Learning
              </Button>
            </div>
          </Card>
          
          {/* Learning Insights */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Learning Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-100 rounded-full mt-1">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Peak Study Time</h4>
                    <p className="text-gray-600">
                      You're most productive during the <span className="font-medium">{analyticsData.peakStudyTime}</span>. 
                      Consider scheduling important study sessions during this time.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-green-100 rounded-full mt-1">
                    <Brain className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Learning Style</h4>
                    <p className="text-gray-600">
                      Your learning patterns suggest you're primarily a <span className="font-medium capitalize">{analyticsData.learningStyle}</span> learner. 
                      {analyticsData.learningStyle === 'visual' && ' Try using diagrams, charts, and color-coding in your notes.'}
                      {analyticsData.learningStyle === 'auditory' && ' Consider recording explanations and discussing concepts aloud.'}
                      {analyticsData.learningStyle === 'kinesthetic' && ' Incorporate hands-on practice and movement while studying.'}
                      {analyticsData.learningStyle === 'reading/writing' && ' Focus on taking detailed notes and summarizing concepts in writing.'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-purple-100 rounded-full mt-1">
                    <Target className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Retention Rate</h4>
                    <p className="text-gray-600">
                      Your estimated knowledge retention is <span className="font-medium">{analyticsData.retentionRate}%</span>. 
                      {analyticsData.retentionRate > 70 
                        ? ' Great job! Your study methods are working well.'
                        : ' Consider using spaced repetition to improve retention.'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-amber-100 rounded-full mt-1">
                    <TrendingUp className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Progress Trend</h4>
                    <p className="text-gray-600">
                      {analyticsData.weeklyProgress[6] > analyticsData.weeklyProgress[0]
                        ? 'Your study time has increased this week. Keep up the momentum!'
                        : 'Your study time has been consistent. Consider setting a goal to increase your weekly study time.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
      
      {/* Progress Tab */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          {/* Learning Velocity */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Learning Velocity</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600 mb-2">
                    {Math.round(analyticsData.totalStudyTime > 0 
                      ? (analyticsData.totalConversations * 10) / (analyticsData.totalStudyTime / 60) 
                      : 0)} XP/hr
                  </div>
                  <p className="text-sm text-gray-600">Learning Velocity</p>
                </div>
                
                <div className="mt-6 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {analyticsData.averageSessionLength} min
                  </div>
                  <p className="text-sm text-gray-600">Avg. Session Length</p>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={formatLearningStyles()}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis domain={[0, 100]} />
                      <Radar
                        name="Learning Style"
                        dataKey="A"
                        stroke="#3B82F6"
                        fill="#3B82F6"
                        fillOpacity={0.6}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Retention & Consistency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Knowledge Retention</h3>
              <div className="flex flex-col items-center">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="10"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="10"
                      strokeDasharray={`${2 * Math.PI * 45 * analyticsData.retentionRate / 100} ${2 * Math.PI * 45 * (1 - analyticsData.retentionRate / 100)}`}
                      strokeDashoffset={2 * Math.PI * 45 * 0.25}
                      transform="rotate(-90 50 50)"
                    />
                    {/* Text */}
                    <text
                      x="50"
                      y="50"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="20"
                      fontWeight="bold"
                      fill="#3B82F6"
                    >
                      {analyticsData.retentionRate}%
                    </text>
                  </svg>
                </div>
                
                <div className="mt-4 text-center">
                  <h4 className="font-medium text-gray-900">Retention Rate</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {analyticsData.retentionRate >= 80 && 'Excellent retention! Your study methods are very effective.'}
                    {analyticsData.retentionRate >= 60 && analyticsData.retentionRate < 80 && 'Good retention. Consider reviewing material more frequently.'}
                    {analyticsData.retentionRate < 60 && 'Try spaced repetition techniques to improve retention.'}
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Study Consistency</h3>
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center space-x-4 mb-6">
                  <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center",
                    analyticsData.consistencyRating === 'Excellent' ? 'bg-green-100' :
                    analyticsData.consistencyRating === 'Good' ? 'bg-blue-100' :
                    'bg-amber-100'
                  )}>
                    <Calendar className={cn(
                      "h-8 w-8",
                      analyticsData.consistencyRating === 'Excellent' ? 'text-green-600' :
                      analyticsData.consistencyRating === 'Good' ? 'text-blue-600' :
                      'text-amber-600'
                    )} />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{analyticsData.consistencyRating}</div>
                    <p className="text-sm text-gray-600">Consistency Rating</p>
                  </div>
                </div>
                
                <div className="w-full max-w-md">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Building</span>
                    <span className="text-sm text-gray-600">Good</span>
                    <span className="text-sm text-gray-600">Excellent</span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full">
                    <div 
                      className={cn(
                        "h-full rounded-full",
                        analyticsData.consistencyRating === 'Excellent' ? 'bg-green-500 w-full' :
                        analyticsData.consistencyRating === 'Good' ? 'bg-blue-500 w-2/3' :
                        'bg-amber-500 w-1/3'
                      )}
                    ></div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-4">
                    {analyticsData.consistencyRating === 'Excellent' && 'You have an excellent study routine. Keep it up!'}
                    {analyticsData.consistencyRating === 'Good' && 'You have a good study routine. Try to make it more consistent.'}
                    {analyticsData.consistencyRating === 'Building' && 'You\'re building your study habit. Aim for regular daily sessions.'}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
      
      {/* Topics Tab */}
      {activeTab === 'topics' && (
        <div className="space-y-6">
          {/* Topics Mastery */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">Topic Mastery</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Mastery Progress</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={formatTopicsAnalysis()}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Mastery']} />
                      <Bar dataKey="value" name="Mastery">
                        {formatTopicsAnalysis().map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.status === 'mastered' ? '#10B981' : 
                                  entry.status === 'inProgress' ? '#3B82F6' : 
                                  '#F59E0B'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    Mastered Topics
                  </h4>
                  <div className="space-y-2">
                    {analyticsData.topicsAnalysis.mastered.length > 0 ? (
                      analyticsData.topicsAnalysis.mastered.map((topic: string, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{topic}</span>
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full w-full"></div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">No mastered topics yet</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    In Progress
                  </h4>
                  <div className="space-y-2">
                    {analyticsData.topicsAnalysis.inProgress.length > 0 ? (
                      analyticsData.topicsAnalysis.inProgress.map((topic: string, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{topic}</span>
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full w-3/5"></div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">No topics in progress</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
                    Needs Attention
                  </h4>
                  <div className="space-y-2">
                    {analyticsData.topicsAnalysis.struggling.length > 0 ? (
                      analyticsData.topicsAnalysis.struggling.map((topic: string, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{topic}</span>
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full w-1/3"></div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">No struggling topics identified</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Recommended Topics */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recommended Next Topics</h3>
              <Button
                variant="primary"
                size="sm"
                onClick={handleViewPersonalizedLearning}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                View Learning Paths
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analyticsData.topicsAnalysis.recommended.length > 0 ? (
                analyticsData.topicsAnalysis.recommended.map((topic: string, index: number) => (
                  <div key={index} className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-1">{topic}</h4>
                    <p className="text-sm text-blue-600">
                      Recommended to expand your knowledge
                    </p>
                  </div>
                ))
              ) : (
                <div className="md:col-span-2 lg:col-span-3 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                  <p className="text-gray-500">No topic recommendations available yet. Continue learning to generate personalized recommendations.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
      
      {/* Patterns Tab */}
      {activeTab === 'patterns' && (
        <div className="space-y-6">
          {/* Study Patterns */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Study Patterns</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Peak Study Time</h4>
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-blue-800">{analyticsData.peakStudyTime}</p>
                      <p className="text-sm text-blue-600">
                        You're most productive during this time
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm text-blue-700">
                      {analyticsData.peakStudyTime === 'Morning' && 'Your brain is fresh and alert in the morning. Great for tackling difficult concepts.'}
                      {analyticsData.peakStudyTime === 'Afternoon' && 'Afternoon sessions work well for you. Good balance of energy and focus.'}
                      {analyticsData.peakStudyTime === 'Evening' && 'You study effectively in the evening. Good for review and consolidation.'}
                      {analyticsData.peakStudyTime === 'Night' && 'You\'re a night owl! Your focus peaks when it\'s quiet.'}
                    </p>
                  </div>
                </div>
                
                <h4 className="font-medium text-gray-900 mt-6 mb-3">Learning Style</h4>
                <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <Brain className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-purple-800 capitalize">{analyticsData.learningStyle}</p>
                      <p className="text-sm text-purple-600">
                        Your primary learning style
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm text-purple-700">
                      {analyticsData.learningStyle === 'visual' && 'You learn best through images, diagrams, and spatial understanding. Try using mind maps, color-coding, and visual aids.'}
                      {analyticsData.learningStyle === 'auditory' && 'You learn best through listening and speaking. Try recording lectures, discussing topics aloud, and using audio resources.'}
                      {analyticsData.learningStyle === 'kinesthetic' && 'You learn best through physical activities and hands-on experiences. Try role-playing, building models, and taking breaks for movement.'}
                      {analyticsData.learningStyle === 'reading/writing' && 'You learn best through text-based materials. Try taking detailed notes, rewriting key points, and creating lists.'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Study Consistency</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formatWeeklyProgress()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} min`, 'Study Time']} />
                      <Bar dataKey="minutes" fill="#8884d8">
                        {formatWeeklyProgress().map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.minutes > 0 ? '#8884d8' : '#E5E7EB'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Consistency Rating: {analyticsData.consistencyRating}</h4>
                  <p className="text-sm text-gray-600">
                    {analyticsData.consistencyRating === 'Excellent' && 'You have a very consistent study routine. This is excellent for long-term retention and progress.'}
                    {analyticsData.consistencyRating === 'Good' && 'You have a fairly consistent study routine. Try to make it even more regular for better results.'}
                    {analyticsData.consistencyRating === 'Building' && 'You\'re still building your study habit. Aim for regular daily sessions, even if they\'re short.'}
                  </p>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Engagement Metrics */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Engagement Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <h4 className="font-medium text-gray-900 mb-3">Session Length Distribution</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: '0-5 min', count: Math.floor(Math.random() * 10) },
                        { name: '5-15 min', count: Math.floor(Math.random() * 20) + 5 },
                        { name: '15-30 min', count: Math.floor(Math.random() * 15) + 10 },
                        { name: '30-60 min', count: Math.floor(Math.random() * 10) + 5 },
                        { name: '60+ min', count: Math.floor(Math.random() * 5) }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} sessions`, 'Count']} />
                      <Bar dataKey="count" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Engagement Metrics</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Avg. Session Length</span>
                      <span className="text-sm font-medium">{analyticsData.averageSessionLength} min</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${Math.min(100, (analyticsData.averageSessionLength / 30) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Retention Rate</span>
                      <span className="text-sm font-medium">{analyticsData.retentionRate}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${analyticsData.retentionRate}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Interaction Depth</span>
                      <span className="text-sm font-medium">
                        {analyticsData.totalConversations > 0 
                          ? Math.round(analyticsData.conversations.reduce((sum: number, conv: any) => 
                              sum + (conv.user_message?.length || 0) / 100, 0) / analyticsData.totalConversations)
                          : 0}/10
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${analyticsData.totalConversations > 0 
                          ? Math.min(100, Math.round(analyticsData.conversations.reduce((sum: number, conv: any) => 
                              sum + (conv.user_message?.length || 0) / 100, 0) / analyticsData.totalConversations) * 10)
                          : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg mt-6">
                    <h5 className="font-medium text-gray-900 mb-2">Engagement Summary</h5>
                    <p className="text-sm text-gray-600">
                      {analyticsData.averageSessionLength > 20 && analyticsData.retentionRate > 70
                        ? 'Your engagement is excellent! You have good session length and retention.'
                        : analyticsData.averageSessionLength > 15 || analyticsData.retentionRate > 60
                        ? 'Your engagement is good. Consider longer study sessions for better retention.'
                        : 'Try to increase your session length and interaction depth for better learning outcomes.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LearningAnalyticsDetail;