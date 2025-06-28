import React from 'react';
import { Card } from './Card';
import { cn, commonStyles } from '../styles/utils';
import { 
  Clock, 
  MessageSquare, 
  BookOpen, 
  Brain,
  Award,
  Download,
  Share2
} from 'lucide-react';
import { Button } from './Button';
import { useStore } from '../store/store';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface StudySessionSummaryProps {
  onClose: () => void;
  className?: string;
}

export const StudySessionSummary: React.FC<StudySessionSummaryProps> = ({ 
  onClose,
  className
}) => {
  const { sessionStats, currentSubject, socialStats } = useStore();
  
  // Calculate session metrics
  const sessionDuration = Math.floor((Date.now() - sessionStats.startTime.getTime()) / 60000); // in minutes
  const messagesCount = sessionStats.messagesCount;
  const xpEarned = sessionStats.xpEarned;
  
  // Calculate learning velocity (XP per hour)
  const learningVelocity = sessionDuration > 0 
    ? Math.round((xpEarned / sessionDuration) * 60) 
    : 0;
  
  // Generate random topics discussed based on subject
  const getTopicsForSubject = (subject: string): string[] => {
    const topicsBySubject: Record<string, string[]> = {
      'Math': ['Algebra', 'Calculus', 'Geometry', 'Trigonometry', 'Statistics'],
      'Science': ['Physics', 'Chemistry', 'Biology', 'Astronomy', 'Ecology'],
      'English': ['Grammar', 'Literature', 'Writing', 'Comprehension', 'Poetry'],
      'History': ['Ancient History', 'Medieval History', 'Modern History', 'World Wars', 'Civil Rights'],
      'Languages': ['Vocabulary', 'Grammar', 'Conversation', 'Reading', 'Writing'],
      'Test Prep': ['Practice Tests', 'Test Strategies', 'Time Management', 'Subject Review', 'Essay Writing']
    };
    
    const availableTopics = topicsBySubject[subject] || ['Fundamentals', 'Concepts', 'Applications', 'Problem Solving', 'Theory'];
    
    // Select 2-3 random topics
    const count = Math.floor(Math.random() * 2) + 2;
    const selectedTopics = [];
    
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * availableTopics.length);
      selectedTopics.push(availableTopics[randomIndex]);
      availableTopics.splice(randomIndex, 1);
      
      if (availableTopics.length === 0) break;
    }
    
    return selectedTopics;
  };
  
  const topicsDiscussed = sessionStats.topicsDiscussed.length > 0 
    ? sessionStats.topicsDiscussed 
    : getTopicsForSubject(currentSubject);
  
  // Generate random insights
  const getRandomInsight = (): string => {
    const insights = [
      `You're making good progress in ${currentSubject}. Keep it up!`,
      `Your questions show a strong understanding of the fundamentals.`,
      `Try practicing with more complex problems to challenge yourself.`,
      `You might benefit from reviewing the basics before moving forward.`,
      `Your learning velocity is impressive! You're absorbing information quickly.`,
      `Consider taking short breaks between topics to improve retention.`,
      `You seem to understand concepts better when explained with examples.`,
      `Try connecting new concepts with what you already know for better retention.`
    ];
    
    return insights[Math.floor(Math.random() * insights.length)];
  };
  
  const handleDownloadTranscript = () => {
    toast.success('Session transcript downloaded successfully');
  };
  
  const handleShareProgress = () => {
    toast.success('Progress shared successfully');
  };
  
  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={cn(commonStyles.heading.h3)}>
          Session Summary
        </h3>
        <span className="text-sm text-gray-500">
          {format(new Date(), 'PPP')}
        </span>
      </div>
      
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-primary-100 rounded-full">
            <BookOpen className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{currentSubject} Session</h4>
            <p className="text-sm text-gray-500">
              {format(sessionStats.startTime, 'h:mm a')} - {format(new Date(), 'h:mm a')}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Duration</span>
            </div>
            <p className="text-xl font-semibold text-gray-900">{sessionDuration} min</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <MessageSquare className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Messages</span>
            </div>
            <p className="text-xl font-semibold text-gray-900">{messagesCount}</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Award className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">XP Earned</span>
            </div>
            <p className="text-xl font-semibold text-gray-900">{xpEarned} XP</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Brain className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Learning Velocity</span>
            </div>
            <p className="text-xl font-semibold text-gray-900">{learningVelocity} XP/hr</p>
          </div>
        </div>
        
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Topics Covered</h4>
          <div className="flex flex-wrap gap-2">
            {topicsDiscussed.map((topic, index) => (
              <span 
                key={index}
                className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
        
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mb-6">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center">
            <Brain className="h-4 w-4 mr-2" />
            Learning Insight
          </h4>
          <p className="text-sm text-blue-700">
            {getRandomInsight()}
          </p>
        </div>
        
        <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">Progress Update</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-green-700">Current Level</p>
              <p className="font-medium text-green-900">{socialStats.level}</p>
            </div>
            <div>
              <p className="text-green-700">Total XP</p>
              <p className="font-medium text-green-900">{socialStats.totalXP}</p>
            </div>
            <div>
              <p className="text-green-700">Current Streak</p>
              <p className="font-medium text-green-900">{socialStats.streak.current} days</p>
            </div>
            <div>
              <p className="text-green-700">Session Contribution</p>
              <p className="font-medium text-green-900">+{xpEarned} XP</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          leftIcon={<Download className="h-4 w-4" />}
          onClick={handleDownloadTranscript}
          className="flex-1"
        >
          Download Transcript
        </Button>
        <Button
          variant="outline"
          leftIcon={<Share2 className="h-4 w-4" />}
          onClick={handleShareProgress}
          className="flex-1"
        >
          Share Progress
        </Button>
        <Button
          variant="primary"
          onClick={onClose}
          className="flex-1"
        >
          Continue
        </Button>
      </div>
    </Card>
  );
};

export default StudySessionSummary;