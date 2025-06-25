import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { cn, commonStyles } from '../styles/utils';
import { useAuth } from '../contexts/AuthContext';
import { TavusService } from '../services/tavusService';
import { startOliviaCounselorConversation } from '../services/tavusStudentCounselor';
import { useStore } from '../store/store';
import { supabase } from '../lib/supabase';
import { API_CONFIG } from '../config/api';
import { 
  Video, 
  Brain, 
  Lightbulb, 
  ArrowLeft, 
  Download, 
  Share2,
  BookOpen,
  Clock,
  BarChart,
  Calendar,
  RefreshCw,
  AlertCircle,
  VideoIcon,
  MessageCircle,
  Award
} from 'lucide-react';
import toast from 'react-hot-toast';

interface LearningInsights {
  learningStyle: string;
  totalStudyTimeHours: number;
  currentStreak: number;
  completionRate: number;
  strengths: string[];
  strugglingTopics: string[];
  nextTopics: string[];
  studyRecommendations: string[];
}

export const StudyAdvisorPage: React.FC = () => {
  const { user } = useAuth();
  const { currentSubject } = useStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isEligible, setIsEligible] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [learningInsights, setLearningInsights] = useState<LearningInsights | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [conversationCount, setConversationCount] = useState(0);
  const [activeMode, setActiveMode] = useState<'video' | 'conversation'>('video');
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    checkEligibilityAndLoadData();
  }, [user, navigate, currentSubject]);

  const checkEligibilityAndLoadData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Check eligibility using existing TavusService
      const eligible = await TavusService.checkEligibilityForTavus(user.id);
      setIsEligible(eligible);
      
      // Get conversation count for progress display
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      const count = conversations?.length || 0;
      setConversationCount(count);
      
      if (eligible) {
        // Load learning insights using existing service
        const insights = await TavusService.getUserLearningProgress(user.id, currentSubject);
        setLearningInsights(transformInsights(insights));
      }
    } catch (error) {
      console.error('Error checking eligibility:', error);
      toast.error('Failed to load study advisor data');
    } finally {
      setIsLoading(false);
    }
  };

  const transformInsights = (progress: any): LearningInsights => {
    return {
      learningStyle: determineLearningStyle(progress),
      totalStudyTimeHours: progress.totalStudyTimeHours || 0,
      currentStreak: progress.currentStreak || 0,
      completionRate: progress.completionRate || 0,
      strengths: progress.strengths || ['Consistent Practice'],
      strugglingTopics: progress.strugglingTopics || [],
      nextTopics: progress.nextTopics || [],
      studyRecommendations: generateStudyRecommendations(progress)
    };
  };

  const determineLearningStyle = (progress: any): string => {
    // Simple heuristic based on completed topics and patterns
    if (progress.completedTopics?.length > progress.strugglingTopics?.length) {
      return 'visual';
    } else if (progress.currentStreak > 5) {
      return 'kinesthetic';
    }
    return 'auditory';
  };

  const generateStudyRecommendations = (progress: any): string[] => {
    const recommendations = [];
    
    if (progress.currentStreak > 0) {
      recommendations.push(`Maintain your ${progress.currentStreak}-day streak with consistent daily practice`);
    }
    
    if (progress.strugglingTopics?.length > 0) {
      recommendations.push(`Focus on ${progress.strugglingTopics[0]} with additional practice problems`);
    }
    
    if (progress.completionRate < 70) {
      recommendations.push('Break down complex topics into smaller, manageable chunks');
    }
    
    recommendations.push('Use active recall techniques to improve retention');
    
    return recommendations;
  };

  const handleGenerateVideo = async () => {
    if (!user || !learningInsights) return;
    
    setIsGenerating(true);
    setVideoError(null);
    
    try {
      // Check if API is configured
      if (!API_CONFIG.TAVUS_API_KEY) {
        throw new Error('Tavus API not configured. Please check your environment variables.');
      }
      
      // Use existing TavusService to create study tip video
      const videoData = await TavusService.createStudyTipVideo(user.id, currentSubject);
      
      if (videoData && videoData.url) {
        setVideoUrl(videoData.url);
        toast.success('Your personalized study advisor video is ready!');
      } else {
        throw new Error('Failed to generate video - no URL returned');
      }
      
    } catch (error) {
      console.error('Error generating Tavus video:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setVideoError(`Unable to generate video: ${errorMessage}`);
      toast.error('Failed to generate video. Please try again later.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartConversation = async () => {
    if (!user) return;
    
    setIsGenerating(true);
    setVideoError(null);
    
    try {
      // Check if API is configured
      if (!API_CONFIG.TAVUS_API_KEY) {
        throw new Error('Tavus API not configured. Please check your environment variables.');
      }
      
      // Use the student counselor service for live conversation
      const conversationUrl = await startOliviaCounselorConversation({
        userId: user.id,
        conversationName: `Study Session - ${currentSubject}`,
        callbackUrl: `${window.location.origin}/study-advisor-callback`,
        apiKey: API_CONFIG.TAVUS_API_KEY,
        customGreeting: `Hi! I'm your AI study advisor. I see you're working on ${currentSubject}. How can I help you improve your learning today?`,
        properties: {
          max_call_duration: 300, // 5 minutes
          participant_left_timeout: 30,
          participant_absent_timeout: 60,
          enable_recording: false,
          enable_closed_captions: true,
          apply_greenscreen: false,
          language: 'english'
        }
      });
      
      if (conversationUrl) {
        setConversationUrl(conversationUrl);
        setActiveMode('conversation');
        toast.success('Live conversation started! You can now talk face-to-face with your AI advisor.');
      } else {
        throw new Error('Failed to start conversation - no URL returned');
      }
      
    } catch (error) {
      console.error('Error starting Tavus conversation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setVideoError(`Unable to start conversation: ${errorMessage}`);
      toast.error('Failed to start live conversation. Please try again later.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareInsights = () => {
    const shareText = `I just got personalized learning insights from my AI Study Advisor! My learning style is ${learningInsights?.learningStyle} and I'm making great progress in ${currentSubject}. Check out Brainbud for AI-powered learning! 🧠📚`;
    
    if (navigator.share) {
      navigator.share({
        title: 'My Brainbud Learning Insights',
        text: shareText,
        url: window.location.origin
      }).catch(() => {
        navigator.clipboard.writeText(shareText)
          .then(() => toast.success('Share text copied to clipboard!'));
      });
    } else {
      navigator.clipboard.writeText(shareText)
        .then(() => toast.success('Share text copied to clipboard!'));
    }
  };

  const endConversation = () => {
    setConversationUrl(null);
    setActiveMode('video');
    toast.success('Conversation ended. You can start a new one anytime!');
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
          <Card className="max-w-2xl mx-auto p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gray-100 rounded-full">
                <Video className="h-12 w-12 text-gray-500" />
              </div>
            </div>
            <h1 className={cn(commonStyles.heading.h2, "mb-4")}>
              Study Advisor Not Yet Available
            </h1>
            <p className={cn(commonStyles.text.lg, "mb-8")}>
              Complete at least 3 learning sessions to unlock personalized study advice from your AI advisor.
            </p>
            <div className="mb-8">
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className="bg-primary-500 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(100, (conversationCount / 3) * 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500">{conversationCount}/3 sessions completed</p>
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
                leftIcon={<ArrowLeft className="h-5 w-5" />}
              >
                Back to Subjects
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
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ArrowLeft className="h-4 w-4" />}
                onClick={() => navigate(-1)}
                className="mb-4"
              >
                Back
              </Button>
              <h1 className={cn(commonStyles.heading.h1, "mb-2")}>
                Your AI Study Advisor
              </h1>
              <p className="text-gray-600">
                Personalized learning insights and study recommendations for {currentSubject}
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                leftIcon={<Share2 className="h-4 w-4" />}
                onClick={handleShareInsights}
              >
                Share
              </Button>
              <Button
                variant="outline"
                leftIcon={<Download className="h-4 w-4" />}
                onClick={() => toast.success('Insights downloaded!')}
              >
                Download
              </Button>
            </div>
          </div>

          {/* Mode Selection */}
          <div className="mb-6">
            <Card className="p-4">
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => setActiveMode('video')}
                  className={cn(
                    "flex items-center px-6 py-3 rounded-lg font-medium transition-colors",
                    activeMode === 'video' 
                      ? "bg-primary-600 text-white shadow-lg" 
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  <VideoIcon className="h-5 w-5 mr-2" />
                  Study Tip Video
                </button>
                <button
                  onClick={() => setActiveMode('conversation')}
                  className={cn(
                    "flex items-center px-6 py-3 rounded-lg font-medium transition-colors",
                    activeMode === 'conversation' 
                      ? "bg-primary-600 text-white shadow-lg" 
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Live Conversation
                </button>
              </div>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content area */}
            <div className="lg:col-span-2">
              <Card className="overflow-hidden">
                {activeMode === 'video' ? (
                  // Video Mode
                  <>
                    {videoUrl ? (
                      <div className="relative">
                        <div className="aspect-video bg-black">
                          <video 
                            ref={videoRef}
                            src={videoUrl}
                            className="w-full h-full"
                            onPlay={() => {}}
                            onPause={() => {}}
                            onError={() => setVideoError('Error playing video')}
                            controls
                            poster="/api/placeholder/800/450"
                          />
                        </div>
                        
                        <div className="p-6">
                          <div className="flex justify-between items-center mb-4">
                            <h2 className={cn(commonStyles.heading.h3)}>
                              Your Personalized Study Tips
                            </h2>
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<RefreshCw className="h-4 w-4" />}
                              onClick={handleGenerateVideo}
                              isLoading={isGenerating}
                            >
                              New Video
                            </Button>
                          </div>
                          <p className={cn(commonStyles.text.base)}>
                            This personalized video contains specific advice for improving your {currentSubject} learning 
                            based on your study patterns and progress.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-200 flex flex-col items-center justify-center p-8 text-center">
                        <Video className="h-16 w-16 text-primary-600 mb-4" />
                        <h2 className={cn(commonStyles.heading.h2, "mb-4")}>
                          Generate Your Study Tips Video
                        </h2>
                        <p className={cn(commonStyles.text.base, "mb-6 max-w-md")}>
                          Get a personalized video with specific advice for improving your {currentSubject} learning.
                        </p>
                        <Button
                          variant="primary"
                          size="lg"
                          onClick={handleGenerateVideo}
                          isLoading={isGenerating}
                          leftIcon={<Lightbulb className="h-5 w-5" />}
                        >
                          Generate Video
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  // Live Conversation Mode
                  <>
                    {conversationUrl ? (
                      <div className="relative">
                        <div className="aspect-video">
                          <iframe
                            ref={iframeRef}
                            src={conversationUrl}
                            className="w-full h-full border-0"
                            allow="camera; microphone; fullscreen"
                            title="AI Study Advisor Conversation"
                          />
                        </div>
                        
                        <div className="p-6">
                          <div className="flex justify-between items-center mb-4">
                            <h2 className={cn(commonStyles.heading.h3)}>
                              Live Study Advisor Session
                            </h2>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={endConversation}
                            >
                              End Conversation
                            </Button>
                          </div>
                          <p className={cn(commonStyles.text.base)}>
                            You're now in a live conversation with your AI study advisor. 
                            Speak naturally and ask any questions about {currentSubject}.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-green-100 to-blue-200 flex flex-col items-center justify-center p-8 text-center">
                        <MessageCircle className="h-16 w-16 text-green-600 mb-4" />
                        <h2 className={cn(commonStyles.heading.h2, "mb-4")}>
                          Start Live Conversation
                        </h2>
                        <p className={cn(commonStyles.text.base, "mb-6 max-w-md")}>
                          Have a 5-minute face-to-face conversation with your AI study advisor. 
                          Get real-time help and personalized guidance.
                        </p>
                        <Button
                          variant="primary"
                          size="lg"
                          onClick={handleStartConversation}
                          isLoading={isGenerating}
                          leftIcon={<Video className="h-5 w-5" />}
                        >
                          Start Live Session
                        </Button>
                      </div>
                    )}
                  </>
                )}
                
                {videoError && (
                  <div className="p-4 bg-red-50 border-t border-red-200">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                      <div className="text-sm text-red-700">
                        <p className="font-medium">Error</p>
                        <p>{videoError}</p>
                        <p className="mt-2 text-xs">
                          Make sure your API keys are configured correctly in your environment variables.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
            
            {/* Sidebar with learning insights */}
            <div className="lg:col-span-1 space-y-6">
              {learningInsights && (
                <>
                  {/* Learning Profile */}
                  <Card className="p-6">
                    <h3 className={cn(commonStyles.heading.h3, "mb-4 flex items-center")}>
                      <Brain className="h-5 w-5 mr-2 text-primary-600" />
                      Your Learning Profile
                    </h3>
                    <div className="p-4 bg-primary-50 rounded-lg mb-4">
                      <div className="text-center">
                        <span className="text-xl font-bold text-primary-700 capitalize">
                          {learningInsights.learningStyle} Learner
                        </span>
                        <p className="text-sm text-primary-600 mt-1">Primary style</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {learningInsights.studyRecommendations.map((rec, index) => (
                        <div key={index} className="flex items-start">
                          <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                          <p className="text-sm text-gray-700">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                  
                  {/* Study Stats */}
                  <Card className="p-6">
                    <h3 className={cn(commonStyles.heading.h3, "mb-4 flex items-center")}>
                      <BarChart className="h-5 w-5 mr-2 text-primary-600" />
                      Study Statistics
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-blue-500 mr-2" />
                          <span className="text-sm text-gray-700">Study Time</span>
                        </div>
                        <span className="font-medium">{learningInsights.totalStudyTimeHours}h</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-sm text-gray-700">Streak</span>
                        </div>
                        <span className="font-medium">{learningInsights.currentStreak} days</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Award className="h-4 w-4 text-purple-500 mr-2" />
                          <span className="text-sm text-gray-700">Completion</span>
                        </div>
                        <span className="font-medium">{learningInsights.completionRate}%</span>
                      </div>
                    </div>
                  </Card>

                  {/* Performance Analysis */}
                  <Card className="p-6">
                    <h3 className={cn(commonStyles.heading.h3, "mb-4")}>Performance</h3>
                    <div className="space-y-4">
                      {learningInsights.strengths.length > 0 && (
                        <div>
                          <h4 className="font-medium text-green-700 mb-2 flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            Strengths
                          </h4>
                          <ul className="space-y-1 pl-4">
                            {learningInsights.strengths.map((strength, index) => (
                              <li key={index} className="text-sm text-gray-700">{strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {learningInsights.strugglingTopics.length > 0 && (
                        <div>
                          <h4 className="font-medium text-amber-700 mb-2 flex items-center">
                            <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                            Focus Areas
                          </h4>
                          <ul className="space-y-1 pl-4">
                            {learningInsights.strugglingTopics.map((topic, index) => (
                              <li key={index} className="text-sm text-gray-700">{topic}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {learningInsights.nextTopics.length > 0 && (
                        <div>
                          <h4 className="font-medium text-blue-700 mb-2 flex items-center">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                            Next Steps
                          </h4>
                          <ul className="space-y-1 pl-4">
                            {learningInsights.nextTopics.map((topic, index) => (
                              <li key={index} className="text-sm text-gray-700">{topic}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </Card>
                </>
              )}
            </div>
          </div>
          
          {/* Call to action */}
          <div className="mt-8">
            <Card className="p-6 bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="mb-4 md:mb-0">
                  <h3 className={cn(commonStyles.heading.h3, "mb-2")}>
                    Ready to apply these insights?
                  </h3>
                  <p className="text-gray-700">
                    Use your personalized recommendations in your next study session.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="primary"
                    onClick={() => navigate('/study')}
                    rightIcon={<ArrowLeft className="h-4 w-4 rotate-180" />}
                  >
                    Start Studying
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/analytics')}
                  >
                    View Analytics
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyAdvisorPage;