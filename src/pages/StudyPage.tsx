import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { VideoArea } from '../components/VideoArea';
import { ChatTranscript } from '../components/ChatTranscript';
import { QuickActionButtons } from '../components/QuickActionButtons';
import { ProgressSidebar } from '../components/ProgressSidebar';
import { DifficultySlider } from '../components/DifficultySlider';
import { SocialFeatures } from '../components/SocialFeatures';
import { ConversationHistory } from '../components/ConversationHistory';
import { StudySessionControls } from '../components/StudySessionControls';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useStore } from '../store/store';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Info, Check } from 'lucide-react';
import { cn, commonStyles } from '../styles/utils';

export const StudyPage: React.FC = () => {
  const { 
    currentSubject, 
    currentAvatar, 
    learningMode, 
    updateSessionStats, 
    difficultyLevel,
    setLearningMode
  } = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDifficultyInfo, setShowDifficultyInfo] = useState(false);
  const [difficultyApplied, setDifficultyApplied] = useState(true);
  const userId = user?.id;
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentSubject || !currentAvatar) {
      navigate('/subjects');
    } else if (!sessionStarted) {
      updateSessionStats({
        startTime: new Date(),
        duration: 0,
        messagesCount: 0,
        topicsDiscussed: [],
        xpEarned: 0
      });
      setSessionStarted(true);
    }
    
    // Ensure we're at the top of the page when component mounts
    window.scrollTo(0, 0);
  }, [currentSubject, currentAvatar, navigate, sessionStarted, updateSessionStats]);

  const getDifficultyDescription = () => {
    switch (difficultyLevel) {
      case 'Elementary':
        return `Elementary level focuses on fundamental concepts in ${currentSubject} with simple explanations and basic examples. Perfect for beginners or younger students.`;
      case 'High School':
        return `High School level covers standard ${currentSubject} curriculum with moderate complexity and practical applications. Suitable for teenage students or adults refreshing their knowledge.`;
      case 'College':
        return `College level explores advanced ${currentSubject} concepts with deeper analysis and complex problem-solving. Appropriate for undergraduate students or professionals.`;
      case 'Advanced':
        return `Advanced level delves into specialized ${currentSubject} topics with sophisticated theoretical frameworks and expert-level applications. Ideal for graduate students or subject matter experts.`;
      default:
        return `Select a difficulty level appropriate for your knowledge of ${currentSubject}.`;
    }
  };

  const handleApplyDifficulty = () => {
    setDifficultyApplied(true);
    setShowDifficultyInfo(false);
  };

  if (!currentSubject || !currentAvatar || !userId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" ref={pageRef}>
      <Header />
      
      <div className="flex-1 container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Back to Subjects Button */}
        <div className="lg:col-span-12">
          <Link 
            to="/subjects" 
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Subjects
          </Link>
        </div>
        
        {/* Difficulty Level Selection */}
        {!difficultyApplied && (
          <div className="lg:col-span-12">
            <Card className="p-6">
              <h2 className={cn(commonStyles.heading.h3, "mb-4")}>
                Set Difficulty Level for {currentSubject}
              </h2>
              
              <div className="mb-6">
                <DifficultySlider />
                
                <button
                  onClick={() => setShowDifficultyInfo(!showDifficultyInfo)}
                  className="mt-2 text-sm text-primary-600 flex items-center"
                >
                  <Info className="h-4 w-4 mr-1" />
                  What does this mean?
                </button>
                
                {showDifficultyInfo && (
                  <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                    {getDifficultyDescription()}
                  </div>
                )}
              </div>
              
              <Button
                variant="primary"
                onClick={handleApplyDifficulty}
                rightIcon={<Check className="h-4 w-4" />}
              >
                Apply Difficulty & Start Learning
              </Button>
            </Card>
          </div>
        )}
        
        {difficultyApplied && (
          <>
            {/* Main Study Area */}
            <div className="lg:col-span-8 space-y-6">
              {learningMode === 'videocall' && (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <VideoArea />
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <DifficultySlider />
                  <div className="mt-2 text-xs text-gray-500">
                    Current: {difficultyLevel} - {getDifficultyDescription().split('.')[0]}.
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm">
                  <QuickActionButtons />
                </div>
              </div>
              
              <div className={`bg-white rounded-lg shadow-sm ${learningMode === 'conversational' ? 'h-[600px]' : 'h-[400px]'}`}>
                <ChatTranscript />
              </div>

              {/* Conversation History Toggle */}
              <Button
                variant="secondary"
                onClick={() => setShowHistory(!showHistory)}
                className="w-full"
              >
                {showHistory ? 'Hide History' : 'Show Conversation History'}
              </Button>

              {/* Conversation History */}
              {showHistory && <ConversationHistory />}
            </div>
            
            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <ProgressSidebar />
              <SocialFeatures />
              
              {/* End Session Button */}
              <StudySessionControls />
            </div>
          </>
        )}
      </div>
    </div>
  );
};