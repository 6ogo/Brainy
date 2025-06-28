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
  Brain
} from 'lucide-react';
import { getAnalyticsData } from '../services/analytics-service';
import { LearningAnalyticsDetail } from '../components/LearningAnalyticsDetail';
import { LearningInsightsSummary } from '../components/LearningInsightsSummary';
import { LearningStyleAnalysis } from '../components/LearningStyleAnalysis';
import { TopicMasteryTracker } from '../components/TopicMasteryTracker';
import { LearningJourneyTimeline } from '../components/LearningJourneyTimeline';

export const LearningAnalytics: React.FC = () => {
  const { user } = useAuth();
  const { currentSubject, socialStats } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'detail' | 'journey' | 'style'>('dashboard');

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
            
            {/* Call to Action */}
            <Card className="p-6 bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-100">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="mb-4 md:mb-0 md:mr-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Enhance Your Learning Experience
                  </h3>
                  <p className="text-gray-600 max-w-xl">
                    Explore detailed analytics, track your progress over time, and get personalized recommendations to improve your learning efficiency.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="primary"
                    onClick={() => setActiveView('detail')}
                    leftIcon={<Brain className="h-5 w-5" />}
                  >
                    View Detailed Analytics
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/study'}
                  >
                    Continue Learning
                  </Button>
                </div>
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
      </div>
    </div>
  );
};

export default LearningAnalytics;