import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { VideoArea } from '../components/VideoArea';
import { ChatTranscript } from '../components/ChatTranscript';
import { QuickActionButtons } from '../components/QuickActionButtons';
import { ProgressSidebar } from '../components/ProgressSidebar';
import { DifficultySlider } from '../components/DifficultySlider';
import { SocialFeatures } from '../components/SocialFeatures';
import { Button } from '../components/Button';
import { useStore } from '../store/store';
import { useAuth } from '../contexts/AuthContext';
import { endStudySession } from '../services/analytics-service';

export const StudyPage: React.FC = () => {
  const { currentSubject, currentAvatar, learningMode, updateSessionStats } = useStore();
  // Get user for session tracking (used when ending the session)
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  // We need userId for saving the session data when it ends
  const userId = user?.id;

  // Validate that we have all required data to start a study session
  useEffect(() => {
    if (!currentSubject || !currentAvatar || !learningMode) {
      // If any required data is missing, redirect to subject selection
      navigate('/subjects');
    } else if (!sessionStarted) {
      // Initialize a new study session in the store
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

  // If missing required data, show nothing while redirecting
  if (!currentSubject || !currentAvatar || !learningMode || !userId) {
    return null;
  }
  
  // Handle ending the study session and saving data
  const handleEndSession = useCallback(async () => {
    if (userId) {
      setIsEnding(true);
      try {
        await endStudySession(userId);
        navigate('/analytics');
      } catch (error) {
        console.error('Failed to end session:', error);
      } finally {
        setIsEnding(false);
      }
    }
  }, [userId, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <div className="flex-1 container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Study Area */}
        <div className="lg:col-span-8 space-y-6">
          {/* Conditionally render VideoArea only in video call mode */}
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
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <ProgressSidebar />
          <SocialFeatures />
          
          {/* End Session Button */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-lg font-semibold mb-4">Session Controls</h3>
            <Button 
              variant="primary" 
              className="w-full" 
              onClick={handleEndSession}
              isLoading={isEnding}
            >
              End Session & View Analytics
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};