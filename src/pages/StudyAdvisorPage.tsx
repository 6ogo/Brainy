import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../store/store';
import { TavusService } from '../services/tavusService';
import { 
  Video, 
  Brain, 
  ArrowLeft, 
  AlertCircle,
  CheckCircle,
  Play,
  MessageCircle,
  Clock,
  BookOpen,
  Award,
  TrendingUp
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

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    checkEligibilityAndLoadData();
  }, [user, navigate]);

  const checkEligibilityAndLoadData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Check eligibility and get session count
      const [eligible, count] = await Promise.all([
        TavusService.checkEligibilityForTavus(user.id),
        TavusService.getCompletedSessionCount(user.id)
      ]);
      
      setIsEligible(eligible);
      setSessionCount(count);
      
      if (eligible) {
        // Load learning insights
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
    if (!user || !isEligible) return;
    
    setIsStartingSession(true);
    setError(null);
    
    try {
      const response = await TavusService.createStudyAdvisorSession(user.id, currentSubject);
      
      if (response.conversation_url) {
        setConversationUrl(response.conversation_url);
        toast.success('Study advisor session started! You can now have a face-to-face conversation.');
      } else {
        throw new Error('No conversation URL received');
      }
      
    } catch (error) {
      console.error('Error starting study session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start study session';
      setError(errorMessage);
      toast.error('Failed to start study session. Please try again.');
    } finally {
      setIsStartingSession(false);
    }
  };

  const handleEndSession = () => {
    setConversationUrl(null);
    toast.success('Study session ended. You can start a new one anytime!');
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
                <Video className="h-12 w-12 text-blue-600" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Study Advisor
            </h1>
            
            <p className="text-lg text-gray-600 mb-8">
              Complete at least 3 learning sessions to unlock personalized study advice from your AI advisor.
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
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Personalized study recommendations</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>5-minute face-to-face video sessions</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Learning style analysis</span>
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
                    <Video className="h-12 w-12 text-green-600" />
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Start Your Study Session
                </h2>
                
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Have a 5-minute face-to-face conversation with your AI study advisor. 
                  Get personalized tips and guidance for {currentSubject}.
                </p>
                
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleStartSession}
                  isLoading={isStartingSession}
                  leftIcon={<Play className="h-5 w-5" />}
                  disabled={isStartingSession}
                >
                  {isStartingSession ? 'Starting Session...' : 'Start Video Session'}
                </Button>
              </Card>

              {/* Study Insights */}
              {insights && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Stats */}
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
                    </div>
                  </Card>

                  {/* Learning Analysis */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Brain className="h-5 w-5 mr-2 text-primary-600" />
                      Learning Analysis
                    </h3>
                    
                    <div className="space-y-3">
                      {insights.strengths.length > 0 && (
                        <div>
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
                      
                      {insights.strugglingTopics.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-amber-700 mb-1">Focus Areas</h4>
                          <p className="text-sm text-gray-600">{insights.strugglingTopics.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              )}

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
                    <h4 className="font-semibold text-gray-900 mb-1">5-Minute Sessions</h4>
                    <p className="text-sm text-gray-600">Focused conversations that respect your time</p>
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