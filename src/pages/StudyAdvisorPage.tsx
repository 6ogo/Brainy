import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../store/store';
import { TavusService } from '../services/tavusService';
import { isTavusConfigured } from '../config/api';
import { 
  Video, 
  ArrowLeft, 
  AlertCircle,
  CheckCircle,
  Play,
  MessageCircle,
  Clock,
  BookOpen,
  Award,
  TrendingUp,
  Crown,
  Zap,
  Users,
  Lock,
  Unlock,
  Timer
} from 'lucide-react';
import toast from 'react-hot-toast';

interface StudyInsights {
  totalSessions: number;
  studyTimeHours: number;
  currentStreak: number;
  completedTopics: string[];
  strugglingTopics: string[];
  nextTopics: string[];
  strengths: string[];
}

interface VideoCallInfo {
  can_start: boolean;
  max_duration_minutes: number;
  subscription_level: string;
}

interface DailyUsageInfo {
  canStart: boolean;
  usage: {
    conversation_minutes: number;
    video_call_minutes: number;
    messages_sent: number;
    subscription_level: string;
  };
}

export const StudyAdvisorPage: React.FC = () => {
  const { user } = useAuth();
  const { currentSubject } = useStore();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isEligible, setIsEligible] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<StudyInsights | null>(null);
  const [videoCallInfo, setVideoCallInfo] = useState<VideoCallInfo | null>(null);
  const [dailyUsage, setDailyUsage] = useState<DailyUsageInfo | null>(null);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    checkConfigurationAndLoadData();
  }, [user, navigate]);

  const checkConfigurationAndLoadData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if Tavus is configured
      if (!isTavusConfigured()) {
        setError('Video conversations are not configured. Please contact support.');
        setIsLoading(false);
        return;
      }
      
      // Load all data in parallel
      const [eligible, count, videoCall, dailyUsageData, history] = await Promise.all([
        TavusService.checkEligibilityForTavus(user.id),
        TavusService.getCompletedSessionCount(user.id),
        TavusService.checkVideoCallAvailability(user.id),
        TavusService.checkDailyConversationLimits(user.id, 30),
        TavusService.getTavusConversationHistory(user.id, 5)
      ]);
      
      setIsEligible(eligible);
      setSessionCount(count);
      setVideoCallInfo(videoCall);
      setDailyUsage(dailyUsageData);
      setConversationHistory(history);
      
      if (eligible && videoCall.can_start) {
        // Load learning insights only if user is eligible
        const progress = await TavusService.getUserLearningProgress(user.id, currentSubject);
        setInsights({
          totalSessions: count,
          studyTimeHours: progress.totalStudyTimeHours,
          currentStreak: progress.currentStreak,
          completedTopics: progress.completedTopics,
          strugglingTopics: progress.strugglingTopics,
          nextTopics: progress.nextTopics,
          strengths: progress.strengths
        });
      }
    } catch (error) {
      console.error('Error loading study advisor data:', error);
      setError('Failed to load study advisor data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSession = async () => {
    if (!user || !isEligible || !videoCallInfo?.can_start) return;
    
    setIsStartingSession(true);
    setError(null);
    
    try {
      const response = await TavusService.createStudyAdvisorSession(user.id, currentSubject);
      
      if (response.conversation_url) {
        setConversationUrl(response.conversation_url);
        
        toast.success(`Study advisor session started! You have ${videoCallInfo.max_duration_minutes} minutes for this session.`, {
          duration: 5000,
          icon: '🎥'
        });
      } else {
        throw new Error('No conversation URL received');
      }
      
    } catch (error) {
      console.error('Error starting study session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start study session';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsStartingSession(false);
    }
  };

  const handleEndSession = async () => {
    if (conversationUrl) {
      // Track the video call time (estimate based on session duration)
      const estimatedMinutes = Math.min(videoCallInfo?.max_duration_minutes || 10, 5); // Estimate 5 minutes or max allowed
      
      try {
        await TavusService.addConversationTime(user!.id, estimatedMinutes, true);
      } catch (error) {
        console.error('Error tracking video call time:', error);
      }
    }
    
    setConversationUrl(null);
    toast.success('Study session ended. You can start a new one anytime!');
    // Refresh data to get updated usage
    checkConfigurationAndLoadData();
  };

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  const getSubscriptionBadge = (level: string) => {
    switch (level) {
      case 'ultimate':
        return { icon: Crown, color: 'text-purple-600 bg-purple-100', text: 'Ultimate' };
      case 'premium':
        return { icon: Zap, color: 'text-blue-600 bg-blue-100', text: 'Premium' };
      default:
        return { icon: Users, color: 'text-gray-600 bg-gray-100', text: 'Free' };
    }
  };

  const formatTimeLimit = (minutes: number) => {
    if (minutes === -1) return 'Unlimited';
    if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  if (isLoading) {
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

  // Error state
  if (error && !videoCallInfo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="outline"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            Back
          </Button>
          
          <Card className="max-w-2xl mx-auto p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-red-100 rounded-full">
                <AlertCircle className="h-12 w-12 text-red-600" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Study Advisor Unavailable
            </h1>
            
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            
            <Button
              variant="primary"
              onClick={() => navigate('/study')}
            >
              Continue Learning
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Not eligible state
  if (!isEligible) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="outline"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            Back
          </Button>
          
          <Card className="max-w-2xl mx-auto p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-blue-100 rounded-full">
                <Lock className="h-12 w-12 text-blue-600" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Study Advisor
            </h1>
            
            <p className="text-lg text-gray-600 mb-8">
              Complete at least 3 learning sessions to unlock personalized video advice from your AI study advisor.
            </p>
            
            <div className="mb-8">
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div 
                  className="bg-primary-500 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(100, (sessionCount / 3) * 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500">
                {sessionCount}/3 sessions completed
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-green-700">Personalized study advice</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-green-700">Face-to-face video sessions</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-green-700">Learning style analysis</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-green-700">Progress tracking</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="primary"
                onClick={() => navigate('/study')}
                leftIcon={<BookOpen className="h-5 w-5" />}
              >
                Continue Learning
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/subjects')}
              >
                Choose Subject
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Video calls not available state
  if (videoCallInfo && !videoCallInfo.can_start) {
    const badge = getSubscriptionBadge(videoCallInfo.subscription_level);
    const Icon = badge.icon;
    
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="outline"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            Back
          </Button>
          
          <Card className="max-w-2xl mx-auto p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-amber-100 rounded-full">
                <Lock className="h-12 w-12 text-amber-600" />
              </div>
            </div>
            
            <div className="flex justify-center mb-4">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
                <Icon className="h-4 w-4 mr-1" />
                {badge.text} Plan
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Video Calls Not Available
            </h1>
            
            {videoCallInfo.subscription_level === 'free' ? (
              <div>
                <p className="text-lg text-gray-600 mb-6">
                  Video calls are not available on the free plan.
                </p>
                
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Upgrade for Video Sessions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
                    <div className="text-center p-3 bg-white rounded">
                      <Zap className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                      <strong>Premium:</strong><br />10-minute video calls
                    </div>
                    <div className="text-center p-3 bg-white rounded">
                      <Crown className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                      <strong>Ultimate:</strong><br />60-minute video calls
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    variant="primary"
                    onClick={handleUpgrade}
                    leftIcon={<Crown className="h-5 w-5" />}
                  >
                    Upgrade Plan
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/study')}
                    leftIcon={<BookOpen className="h-5 w-5" />}
                  >
                    Continue Text Learning
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-lg text-gray-600 mb-6">
                  There was an issue accessing video calls for your account.
                </p>
                
                <Button
                  variant="primary"
                  onClick={() => checkConfigurationAndLoadData()}
                >
                  Try Again
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="outline"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            Back
          </Button>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              AI Study Advisor
            </h1>
            <p className="text-gray-600">
              Get personalized study advice for {currentSubject}
            </p>
            
            {videoCallInfo && dailyUsage && (
              <div className="flex justify-center items-center space-x-4 mt-4">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSubscriptionBadge(videoCallInfo.subscription_level).color}`}>
                  {React.createElement(getSubscriptionBadge(videoCallInfo.subscription_level).icon, { className: "h-4 w-4 mr-1" })}
                  {getSubscriptionBadge(videoCallInfo.subscription_level).text} Plan
                </div>
                <div className="text-sm text-gray-500 flex items-center">
                  <Timer className="h-4 w-4 mr-1" />
                  {formatTimeLimit(videoCallInfo.max_duration_minutes)} video calls
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          {conversationUrl ? (
            /* Active Video Session */
            <Card className="overflow-hidden">
              <div className="aspect-video bg-black relative">
                <iframe
                  src={conversationUrl}
                  className="w-full h-full border-0"
                  allow="camera; microphone; fullscreen"
                  title="AI Study Advisor Session"
                />
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      Live Study Session
                    </h2>
                    <p className="text-gray-600">
                      You're now talking with your AI study advisor. Ask questions about your learning!
                    </p>
                  </div>
                  
                  <Button
                    variant="secondary"
                    onClick={handleEndSession}
                  >
                    End Session
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            /* Start Session Interface */
            <div className="space-y-6">
              {/* Error Display */}
              {error && (
                <Card className="p-4 bg-red-50 border border-red-200">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-red-800">Session Error</h3>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setError(null)}
                        className="mt-2"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Start Session Card */}
              <Card className="p-8 text-center">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-green-100 rounded-full">
                    <Unlock className="h-12 w-12 text-green-600" />
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Start Your Study Session
                </h2>
                
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Have a personalized face-to-face conversation with your AI study advisor. 
                  Get tailored tips and guidance for {currentSubject}.
                </p>
                
                {videoCallInfo && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Timer className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-800">
                        Session Duration: {formatTimeLimit(videoCallInfo.max_duration_minutes)}
                      </span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Make the most of your personalized video session
                    </p>
                  </div>
                )}
                
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleStartSession}
                  isLoading={isStartingSession}
                  leftIcon={<Play className="h-5 w-5" />}
                  disabled={isStartingSession || !videoCallInfo?.can_start}
                >
                  {isStartingSession ? 'Starting Session...' : 'Start Video Session'}
                </Button>
              </Card>

              {/* Study Insights and Conversation History */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Study Insights */}
                {insights && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-primary-600" />
                      Your Progress
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Sessions</span>
                        <span className="font-semibold">{insights.totalSessions}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Study Time</span>
                        <span className="font-semibold">{insights.studyTimeHours.toFixed(1)}h</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Current Streak</span>
                        <span className="font-semibold">{insights.currentStreak} days</span>
                      </div>
                      
                      {insights.strengths.length > 0 && (
                        <div className="pt-2 border-t">
                          <h4 className="text-sm font-medium text-green-700 mb-1">Strengths</h4>
                          <p className="text-sm text-gray-600">{insights.strengths.join(', ')}</p>
                        </div>
                      )}
                      
                      {insights.nextTopics.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-blue-700 mb-1">Recommended Next</h4>
                          <p className="text-sm text-gray-600">{insights.nextTopics.slice(0, 2).join(', ')}</p>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Recent Conversations */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2 text-primary-600" />
                    Recent Sessions
                  </h3>
                  
                  {conversationHistory.length > 0 ? (
                    <div className="space-y-3">
                      {conversationHistory.map((conv) => (
                        <div key={conv.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-sm font-medium text-gray-700">
                              {conv.subject}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(conv.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              conv.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                            }`}></div>
                            <span className="text-xs text-gray-500 capitalize">
                              {conv.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <Video className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No video sessions yet</p>
                    </div>
                  )}
                </Card>
              </div>

              {/* What to Expect */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  What to Expect
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="p-3 bg-blue-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                      <MessageCircle className="h-6 w-6 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">Personalized Advice</h4>
                    <p className="text-sm text-gray-600">Get study tips tailored to your learning style and progress</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="p-3 bg-green-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">Focused Sessions</h4>
                    <p className="text-sm text-gray-600">Efficient conversations that respect your time and goals</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="p-3 bg-purple-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                      <Award className="h-6 w-6 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">Action Plans</h4>
                    <p className="text-sm text-gray-600">Concrete steps to improve your learning outcomes</p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};