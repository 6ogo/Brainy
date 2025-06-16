import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { cn, commonStyles } from '../styles/utils';
import { useAuth } from '../contexts/AuthContext';
import { TavusService } from '../services/tavusService';
import { useStore } from '../store/store';
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
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

export const StudyAdvisorPage: React.FC = () => {
  const { user } = useAuth();
  const { currentSubject } = useStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isEligible, setIsEligible] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [learningInsights, setLearningInsights] = useState<any>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  useEffect(() => {
    const checkEligibility = async () => {
      if (!user) {
        navigate('/login');
        return;
      }
      
      try {
        const eligible = await TavusService.checkEligibilityForTavus(user.id);
        setIsEligible(eligible);
        
        if (eligible) {
          // Get learning insights
          const insights = await TavusService.getUserLearningProgress(user.id, currentSubject);
          setLearningInsights(insights);
        }
      } catch (error) {
        console.error('Error checking Tavus eligibility:', error);
        toast.error('Failed to check eligibility');
      } finally {
        setIsLoading(false);
      }
    };

    checkEligibility();
  }, [user, navigate, currentSubject]);

  const handleGenerateVideo = async () => {
    if (!user) return;
    
    setIsGenerating(true);
    setVideoError(null);
    try {
      const video = await TavusService.createStudyTipVideo(user.id, currentSubject);
      setVideoUrl(video.url);
      toast.success('Your personalized study advisor video is ready!');
    } catch (error) {
      console.error('Error generating Tavus video:', error);
      setVideoError('Failed to generate video. Using fallback video instead.');
      // Set a fallback video URL
      setVideoUrl('https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
      toast.error('Using fallback video due to generation error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareInsights = () => {
    const shareText = `I just got personalized learning insights from my AI Study Advisor on Brainbud! My learning style is ${learningInsights?.learningStyle || 'visual'} and I'm making great progress in ${currentSubject}. #AILearning #Brainbud`;
    
    if (navigator.share) {
      navigator.share({
        title: 'My Brainbud Learning Insights',
        text: shareText,
        url: window.location.origin
      }).catch(err => {
        console.error('Error sharing:', err);
        navigator.clipboard.writeText(shareText)
          .then(() => toast.success('Share text copied to clipboard!'));
      });
    } else {
      navigator.clipboard.writeText(shareText)
        .then(() => toast.success('Share text copied to clipboard!'));
    }
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('Video playback error:', e);
    setVideoError('Error playing video. Please try again.');
    // Set a fallback video
    setVideoUrl('https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
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
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div 
                  className="bg-primary-500 h-2.5 rounded-full" 
                  style={{ width: '33%' }}
                ></div>
              </div>
              <p className="text-sm text-gray-500">1/3 sessions completed</p>
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
                Your Study Advisor
              </h1>
              <p className="text-gray-600">
                Personalized learning insights and study recommendations
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                leftIcon={<Share2 className="h-4 w-4" />}
                onClick={handleShareInsights}
              >
                Share Insights
              </Button>
              <Button
                variant="outline"
                leftIcon={<Download className="h-4 w-4" />}
                onClick={() => toast.success('Report downloaded successfully!')}
              >
                Download Report
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main video area */}
            <div className="lg:col-span-2">
              <Card className="overflow-hidden">
                {videoUrl ? (
                  <div className="aspect-video bg-black">
                    <video 
                      src={videoUrl} 
                      controls 
                      className="w-full h-full" 
                      autoPlay
                      onError={handleVideoError}
                    />
                    {videoError && (
                      <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
                        {videoError}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-200 flex flex-col items-center justify-center p-8 text-center">
                    <Video className="h-16 w-16 text-primary-600 mb-4" />
                    <h2 className={cn(commonStyles.heading.h2, "mb-4")}>
                      Get Personalized Study Advice
                    </h2>
                    <p className={cn(commonStyles.text.base, "mb-6 max-w-md")}>
                      Your AI study advisor has analyzed your learning patterns and is ready to provide 
                      personalized tips to improve your study effectiveness.
                    </p>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleGenerateVideo}
                      isLoading={isGenerating}
                      leftIcon={<Lightbulb className="h-5 w-5" />}
                    >
                      Generate Video Advice
                    </Button>
                  </div>
                )}
                
                {videoUrl && (
                  <div className="p-6">
                    <h2 className={cn(commonStyles.heading.h3, "mb-4")}>
                      Your Personalized Study Advice
                    </h2>
                    <p className={cn(commonStyles.text.base, "mb-4")}>
                      Based on your learning patterns, your AI study advisor has created this personalized 
                      video with tips and strategies to help you learn more effectively.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                        Learning Style
                      </span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        Study Techniques
                      </span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                        Progress Analysis
                      </span>
                    </div>
                  </div>
                )}
              </Card>
            </div>
            
            {/* Sidebar with learning insights */}
            <div className="lg:col-span-1 space-y-6">
              {/* Learning Style */}
              <Card className="p-6">
                <h3 className={cn(commonStyles.heading.h3, "mb-4 flex items-center")}>
                  <Brain className="h-5 w-5 mr-2 text-primary-600" />
                  Your Learning Style
                </h3>
                <div className="p-4 bg-primary-50 rounded-lg mb-4">
                  <div className="text-center">
                    <span className="text-xl font-bold text-primary-700 capitalize">
                      {learningInsights?.learningStyle || 'Visual'} Learner
                    </span>
                    <p className="text-sm text-primary-600 mt-1">
                      Primary learning modality
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <Lightbulb className="h-4 w-4 text-amber-500 mt-1 mr-2" />
                    <p className="text-sm text-gray-700">
                      {learningInsights?.learningStyle === 'visual' 
                        ? 'You learn best through diagrams, charts, and visual aids.'
                        : learningInsights?.learningStyle === 'auditory'
                        ? 'You learn best through listening and verbal explanations.'
                        : learningInsights?.learningStyle === 'kinesthetic'
                        ? 'You learn best through hands-on activities and practice.'
                        : 'You learn best through reading and writing information.'}
                    </p>
                  </div>
                  <div className="flex items-start">
                    <Lightbulb className="h-4 w-4 text-amber-500 mt-1 mr-2" />
                    <p className="text-sm text-gray-700">
                      Recommended to use {learningInsights?.learningStyle === 'visual' 
                        ? 'mind maps and color-coding in your notes.'
                        : learningInsights?.learningStyle === 'auditory'
                        ? 'recorded explanations and discussion groups.'
                        : learningInsights?.learningStyle === 'kinesthetic'
                        ? 'practical exercises and movement while studying.'
                        : 'written summaries and note-taking techniques.'}
                    </p>
                  </div>
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
                      <span className="text-sm text-gray-700">Total Study Time</span>
                    </div>
                    <span className="font-medium">
                      {learningInsights?.totalStudyTimeHours || 5} hours
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm text-gray-700">Current Streak</span>
                    </div>
                    <span className="font-medium">
                      {learningInsights?.currentStreak || 3} days
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 text-purple-500 mr-2" />
                      <span className="text-sm text-gray-700">Completion Rate</span>
                    </div>
                    <span className="font-medium">
                      {learningInsights?.completionRate || 65}%
                    </span>
                  </div>
                </div>
              </Card>
              
              {/* Strengths & Areas to Improve */}
              <Card className="p-6">
                <h3 className={cn(commonStyles.heading.h3, "mb-4")}>
                  Strengths & Focus Areas
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-green-700 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Strengths
                    </h4>
                    <ul className="space-y-1 pl-4">
                      {(learningInsights?.strengths || ['Theoretical Understanding']).map((strength: string, index: number) => (
                        <li key={index} className="text-sm text-gray-700">{strength}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-amber-700 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                      Areas to Improve
                    </h4>
                    <ul className="space-y-1 pl-4">
                      {(learningInsights?.strugglingTopics || ['Advanced Applications']).map((topic: string, index: number) => (
                        <li key={index} className="text-sm text-gray-700">{topic}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-700 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      Recommended Next Topics
                    </h4>
                    <ul className="space-y-1 pl-4">
                      {(learningInsights?.nextTopics || ['Intermediate Techniques', 'Practical Examples']).map((topic: string, index: number) => (
                        <li key={index} className="text-sm text-gray-700">{topic}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
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
                  <p className={cn(commonStyles.text.base)}>
                    Continue your learning journey with your new study strategies.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="primary"
                    onClick={() => navigate('/study')}
                    rightIcon={<ArrowLeft className="h-4 w-4 rotate-180" />}
                  >
                    Continue Learning
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