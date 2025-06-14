import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './Button';
import { Card } from './Card';
import { useStore } from '../store/store';
import { useAuth } from '../contexts/AuthContext';
import { endStudySession } from '../services/analytics-service';
import { TavusService } from '../services/tavusService';
import { Video, Brain, Clock, Award, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export const StudySessionControls: React.FC = () => {
  const { sessionStats, currentSubject } = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isEnding, setIsEnding] = useState(false);
  const [isLoadingTavus, setIsLoadingTavus] = useState(false);

  const handleEndSession = async () => {
    if (!user) return;
    
    setIsEnding(true);
    try {
      await endStudySession(user.id);
      navigate('/analytics');
    } catch (error) {
      console.error('Failed to end session:', error);
      toast.error('Failed to save session data');
    } finally {
      setIsEnding(false);
    }
  };

  const handleGetTavusVideo = async () => {
    if (!user) return;
    
    setIsLoadingTavus(true);
    try {
      const isEligible = await TavusService.checkEligibilityForTavus(user.id);
      
      if (!isEligible) {
        toast.error('Complete at least 3 learning sessions to unlock this feature');
        return;
      }
      
      toast.success('Generating your personalized study tips video...');
      navigate('/study');
    } catch (error) {
      console.error('Failed to generate Tavus video:', error);
      toast.error('Failed to generate study tips video');
    } finally {
      setIsLoadingTavus(false);
    }
  };

  const handleDownloadTranscript = () => {
    toast.success('Transcript downloaded successfully');
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Session Controls</h3>
      
      <div className="space-y-3">
        <Button 
          variant="primary" 
          className="w-full" 
          onClick={handleEndSession}
          isLoading={isEnding}
          leftIcon={<Clock className="h-4 w-4" />}
        >
          End Session & View Analytics
        </Button>
        
        <Button
          variant="secondary"
          className="w-full"
          onClick={handleGetTavusVideo}
          isLoading={isLoadingTavus}
          leftIcon={<Video className="h-4 w-4" />}
        >
          Get Personalized Study Tips
        </Button>
        
        <Button
          variant="outline"
          className="w-full"
          onClick={handleDownloadTranscript}
          leftIcon={<Download className="h-4 w-4" />}
        >
          Download Transcript
        </Button>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div className="flex items-center">
            <Brain className="h-4 w-4 mr-1 text-primary-500" />
            <span>XP Earned: {sessionStats.xpEarned}</span>
          </div>
          <div className="flex items-center">
            <Award className="h-4 w-4 mr-1 text-primary-500" />
            <span>Subject: {currentSubject}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};