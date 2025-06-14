import React, { useEffect, useState } from 'react';
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
import { useStore } from '../store/store';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';

export const StudyPage: React.FC = () => {
  const { currentSubject, currentAvatar, learningMode, updateSessionStats } = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const userId = user?.id;

  useEffect(() => {
    if (!currentSubject || !currentAvatar || !learningMode) {
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
  }, [currentSubject, currentAvatar, learningMode, navigate, sessionStarted, updateSessionStats]);

  if (!currentSubject || !currentAvatar || !learningMode || !userId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
      </div>
    </div>
  );
};