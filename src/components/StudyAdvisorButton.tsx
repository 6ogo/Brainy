import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Brain, Lightbulb, ArrowRight } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';
import { cn, commonStyles } from '../styles/utils';
import { useAuth } from '../contexts/AuthContext';
import { TavusService } from '../services/tavusService';
import toast from 'react-hot-toast';

export const StudyAdvisorButton: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isEligible, setIsEligible] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const checkEligibility = async () => {
      if (!user) return;
      
      try {
        const eligible = await TavusService.checkEligibilityForTavus(user.id);
        setIsEligible(eligible);
        
        // Get session count for progress indicator
        const count = await TavusService.getCompletedSessionCount(user.id);
        setSessionCount(count);
      } catch (error) {
        console.error('Error checking Tavus eligibility:', error);
      }
    };

    checkEligibility();
  }, [user]);

  const handleGetStudyAdvice = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!isEligible) {
      toast.error('Complete at least 3 learning sessions to unlock this feature');
      return;
    }
    
    setIsLoading(true);
    try {
      navigate('/study-advisor');
    } catch (error) {
      console.error('Failed to navigate to study advisor:', error);
      toast.error('Failed to access study advisor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={cn(
      "p-6 relative overflow-hidden transition-all duration-300",
      isEligible ? "border-green-300 bg-gradient-to-br from-green-50 to-blue-50" : "border-gray-200"
    )}>
      {isEligible && (
        <div className="absolute top-0 right-0">
          <div className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-bl-md">
            UNLOCKED
          </div>
        </div>
      )}
      
      <div className="flex items-start space-x-4">
        <div className={cn(
          "p-3 rounded-full flex-shrink-0",
          isEligible ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"
        )}>
          <Video className="h-6 w-6" />
        </div>
        
        <div className="flex-1">
          <h3 className={cn(
            commonStyles.heading.h3,
            "mb-2 flex items-center"
          )}>
            <span>Study Advisor</span>
            {isEligible && (
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Premium
              </span>
            )}
          </h3>
          
          <p className={cn(commonStyles.text.base, "mb-4")}>
            {isEligible 
              ? "Get personalized study tips and learning style analysis from your AI study advisor."
              : "Complete 3 study sessions to unlock personalized video advice from your AI study advisor."}
          </p>
          
          {!isEligible && (
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-primary-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (sessionCount / 3) * 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {sessionCount}/3 sessions completed
              </p>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant={isEligible ? "primary" : "secondary"}
              onClick={handleGetStudyAdvice}
              isLoading={isLoading}
              disabled={!isEligible}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              {isEligible ? "Get Study Advice" : "Unlock Feature"}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowInfo(!showInfo)}
            >
              Learn More
            </Button>
          </div>
          
          {showInfo && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                <Lightbulb className="h-4 w-4 mr-1" />
                How the Study Advisor Works
              </h4>
              <ul className="text-sm text-blue-700 space-y-1 list-disc pl-5">
                <li>Analyzes your learning patterns across multiple sessions</li>
                <li>Identifies your unique learning style and strengths</li>
                <li>Provides personalized study techniques and strategies</li>
                <li>Recommends optimal study schedules and approaches</li>
                <li>Helps you overcome specific learning challenges</li>
              </ul>
              <p className="text-xs text-blue-600 mt-2">
                Available after completing at least 3 study sessions to gather sufficient learning data.
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};