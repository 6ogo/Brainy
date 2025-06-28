import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from './Card';
import { Button } from './Button';
import { useStore } from '../store/store';
import { useAuth } from '../contexts/AuthContext';
import { endStudySession } from '../services/analytics-service';
import { StudySessionSummary } from './StudySessionSummary';
import { 
  BarChart, 
  BookOpen, 
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

interface StudySessionEndModalProps {
  onClose: () => void;
  className?: string;
}

export const StudySessionEndModal: React.FC<StudySessionEndModalProps> = ({ 
  onClose,
  className
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isEnding, setIsEnding] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  
  const handleEndSession = async () => {
    if (!user) return;
    
    setIsEnding(true);
    try {
      await endStudySession(user.id);
      setShowSummary(true);
    } catch (error) {
      console.error('Failed to end session:', error);
      toast.error('Failed to save session data');
      onClose();
    } finally {
      setIsEnding(false);
    }
  };
  
  const handleViewAnalytics = () => {
    navigate('/analytics');
  };
  
  const handleContinueSession = () => {
    onClose();
  };
  
  if (showSummary) {
    return (
      <StudySessionSummary 
        onClose={() => {
          navigate('/analytics');
        }}
      />
    );
  }
  
  return (
    <Card className={className}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            End Study Session?
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <p className="text-gray-600 mb-6">
          Are you sure you want to end your current study session? Your progress will be saved and analytics will be updated.
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <BookOpen className="h-6 w-6 text-primary-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">View session summary</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <BarChart className="h-6 w-6 text-primary-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Update learning analytics</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleContinueSession}
            className="flex-1"
          >
            Continue Session
          </Button>
          
          <Button
            variant="primary"
            onClick={handleEndSession}
            isLoading={isEnding}
            className="flex-1"
          >
            End & View Summary
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default StudySessionEndModal;