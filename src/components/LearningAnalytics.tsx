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
  Trophy,
  Download,
  Filter,
  AlertCircle,
  Loader,
  BookOpen,
  Brain,
  Layers,
  ArrowRight
} from 'lucide-react';
import { getAnalyticsData } from '../services/analytics-service';
import { LearningAnalyticsDetail } from './LearningAnalyticsDetail';
import { LearningInsightsSummary } from './LearningInsightsSummary';
import { LearningStyleAnalysis } from './LearningStyleAnalysis';
import { TopicMasteryTracker } from './TopicMasteryTracker';
import { LearningJourneyTimeline } from './LearningJourneyTimeline';
import { useNavigate } from 'react-router-dom';

export const LearningAnalytics: React.FC = () => {
  const { user } = useAuth();
  const { currentSubject, socialStats } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'detail' | 'journey' | 'style' | 'context'>('dashboard');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadAnalyticsData();
    }
  }, [user]);

  const loadAnalyticsData = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await getAnalyticsData(user.id);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewContextAnalytics = () => {
    navigate('/context-analytics');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <Loader className="h-12 w-12 text-primary-600 animate-spin mb-4" />
              <p className="text-gray-600">Loading your learning analytics...</p>
            </div>
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
          <Card className="p-8 max-w-2xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Analytics Error
              </h2>
              <p className="text-gray-600 mb-6">
                {error}
              </p>
              <Button
                variant="primary"
                onClick={loadAnalyticsData}
              >
                Try Again
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="p-8 max-w-2xl mx-auto text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Learning Data Yet
            </h2>
            <p className="text-gray-600 mb-6">
              Start learning with Brainbud to generate personalized analytics and insights.
            </p>
            <Button
              variant="primary"
              onClick={() => window.location.href = '/study'}
            >
              Start Learning
            </Button>
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
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
              Learning Analytics
            </h1>
            <p className="text-gray-600">Track your progress and learning journey</p>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={loadAnalyticsData}
              leftIcon={<Filter className="h-4 w-4" />}
            >
              Refresh Data
            </Button>
            <Button 
              variant="primary" 
              onClick={() => window.location.href = '/study'}
              leftIcon={<BookOpen className="h-4 w-4" />}
            >
              Continue Learning
            </Button>
          </div>
        </div>

        {/* View Selector */}
        <div className="mb-6">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            <Button
              variant={activeView === 'dashboard' ? 'primary' : 'outline'}
              onClick={() => setActiveView('dashboard')}
              size="sm"
            >
              Dashboard
            </Button>
            <Button
              variant={activeView === 'detail' ? 'primary' : 'outline'}
              onClick={() => setActiveView('detail')}
              size="sm"
            >
              Detailed Analytics
            </Button>
            <Button
              variant={activeView === 'style' ? 'primary' : 'outline'}
              onClick={() => setActiveView('style')}
              size="sm"
            >
              Learning Style
            </Button>
            <Button
              variant={activeView === 'journey' ? 'primary' : 'outline'}
              onClick={() => setActiveView('journey')}
              size="sm"
            >
              Learning Journey
            </Button>
            <Button
              variant={activeView === 'context' ? 'primary' : 'outline'}
              onClick={() => setActiveView('context')}
              size="sm"
            >
              Context Analytics
            </Button>
          </div>
        </div>

        {/* Dashboard View */}
        {activeView === 'dashboard' && (
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
                    <MessageSquare className="h-5 w-5" />
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
                    <p className="text-sm text-gray-500">Current Streak</p>
                    <p className="text-xl font-semibold">{socialStats.streak.current} days</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Achievements</p>
                    <p className="text-xl font-semibold">{socialStats.achievements.length}</p>
                  </div>
                </div>
              </Card>
            </div>
            
            {/* Learning Insights */}
            <LearningInsightsSummary analyticsData={analyticsData} />
            
            {/* Topic Mastery */}
            <TopicMasteryTracker 
              topicsAnalysis={analyticsData.topicsAnalysis} 
              subject={currentSubject}
            />
            
            {/* Context Management Card */}
            <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="mb-4 md:mb-0 md:mr-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
                    <Layers className="h-5 w-5 mr-2 text-indigo-600" />
                    Context Management Analytics
                  </h3>
                  <p className="text-gray-600 max-w-xl">
                    Explore how well context is maintained across your conversations. Track context retention, memory usage, and response relevance metrics.
                  </p>
                </div>
                <Button
                  variant="primary"
                  onClick={handleViewContextAnalytics}
                  rightIcon={<ArrowRight className="h-5 w-5" />}
                >
                  View Context Analytics
                </Button>
              </div>
            </Card>
          </div>
        )}
        
        {/* Detailed Analytics View */}
        {activeView === 'detail' && (
          <LearningAnalyticsDetail analyticsData={analyticsData} userId={user!.id} />
        )}
        
        {/* Learning Style View */}
        {activeView === 'style' && (
          <LearningStyleAnalysis learningStyle={analyticsData.learningStyle} />
        )}
        
        {/* Learning Journey View */}
        {activeView === 'journey' && (
          <LearningJourneyTimeline conversations={analyticsData.conversations} />
        )}
        
        {/* Context Analytics View */}
        {activeView === 'context' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
                  <Layers className="h-5 w-5 mr-2 text-indigo-600" />
                  Context Management Analytics
                </h3>
                <p className="text-gray-600">
                  Track how well context is maintained across your conversations
                </p>
              </div>
              <Button
                variant="primary"
                onClick={handleViewContextAnalytics}
                rightIcon={<ArrowRight className="h-5 w-5" />}
              >
                View Full Dashboard
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center space-x-3 mb-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-blue-800">Context Retention</h4>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-blue-700">Overall Score</span>
                  <span className="text-sm font-medium text-blue-800">78%</span>
                </div>
                <div className="w-full h-2 bg-blue-200 rounded-full">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '78%' }}></div>
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  How well information is remembered across conversations
                </p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-center space-x-3 mb-2">
                  <Zap className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium text-green-800">Response Relevance</h4>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-green-700">Overall Score</span>
                  <span className="text-sm font-medium text-green-800">85%</span>
                </div>
                <div className="w-full h-2 bg-green-200 rounded-full">
                  <div className="h-full bg-green-600 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <p className="text-xs text-green-700 mt-2">
                  How relevant responses are to the conversation context
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex items-center space-x-3 mb-2">
                  <Layers className="h-5 w-5 text-purple-600" />
                  <h4 className="font-medium text-purple-800">Memory Efficiency</h4>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-purple-700">Overall Score</span>
                  <span className="text-sm font-medium text-purple-800">82%</span>
                </div>
                <div className="w-full h-2 bg-purple-200 rounded-full">
                  <div className="h-full bg-purple-600 rounded-full" style={{ width: '82%' }}></div>
                </div>
                <p className="text-xs text-purple-700 mt-2">
                  How efficiently memory is used to store conversation context
                </p>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-4">Context Management Insights</h4>
              
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="p-1.5 bg-blue-100 rounded-full mt-0.5">
                      <Brain className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h5 className="font-medium text-blue-800 mb-1">Strong Short-term Retention</h5>
                      <p className="text-sm text-blue-700">
                        Your conversations show excellent short-term context retention (92%). Information shared within the same session is consistently remembered and utilized.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="p-1.5 bg-amber-100 rounded-full mt-0.5">
                      <Clock className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <h5 className="font-medium text-amber-800 mb-1">Long-term Retention Opportunity</h5>
                      <p className="text-sm text-amber-700">
                        Long-term context retention (across multiple days) shows room for improvement (65%). Consider summarizing key points at the end of sessions to reinforce memory.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <Button
                  variant="primary"
                  onClick={handleViewContextAnalytics}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  View Full Context Analytics
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};