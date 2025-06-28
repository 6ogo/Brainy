import React, { useState } from 'react';
import { Card } from './Card';
import { cn, commonStyles } from '../styles/utils';
import { 
  ArrowLeft, 
  BookOpen, 
  Play, 
  Clock, 
  Award, 
  CheckCircle,
  Video,
  Headphones,
  FileText,
  Zap,
  AlertTriangle,
  BarChart
} from 'lucide-react';
import { Button } from './Button';
import { LearningPathTopic, updateTopicProgress } from '../services/personalizationService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface TopicDetailViewProps {
  topic: LearningPathTopic;
  onBack: () => void;
  className?: string;
}

export const TopicDetailView: React.FC<TopicDetailViewProps> = ({
  topic,
  onBack,
  className
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'assessments'>('overview');
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentMasteryScore, setCurrentMasteryScore] = useState(topic.masteryScore);
  
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-5 w-5 text-blue-600" />;
      case 'audio':
        return <Headphones className="h-5 w-5 text-purple-600" />;
      case 'text':
        return <FileText className="h-5 w-5 text-amber-600" />;
      case 'interactive':
        return <Zap className="h-5 w-5 text-green-600" />;
      default:
        return <BookOpen className="h-5 w-5 text-gray-600" />;
    }
  };
  
  const getResourceTypeColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'audio':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'text':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'interactive':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getLearningStyleColor = (style: string) => {
    switch (style) {
      case 'visual':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'auditory':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'kinesthetic':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'reading/writing':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} hr`;
    }
    
    return `${hours} hr ${remainingMinutes} min`;
  };
  
  const handleMarkAsCompleted = async () => {
    if (!user) return;
    
    try {
      setIsUpdating(true);
      
      // Update topic status to completed with 100% mastery
      await updateTopicProgress(topic.id, 'completed', 100);
      
      // Update local state
      setCurrentMasteryScore(100);
      
      toast.success('Topic marked as completed!');
      
      // Go back to learning path view
      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (err) {
      console.error('Error marking topic as completed:', err);
      toast.error('Failed to update topic status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleMarkAsInProgress = async () => {
    if (!user) return;
    
    try {
      setIsUpdating(true);
      
      // Update topic status to in_progress with 50% mastery
      await updateTopicProgress(topic.id, 'in_progress', 50);
      
      // Update local state
      setCurrentMasteryScore(50);
      
      toast.success('Topic marked as in progress!');
    } catch (err) {
      console.error('Error marking topic as in progress:', err);
      toast.error('Failed to update topic status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleMarkAsStruggling = async () => {
    if (!user) return;
    
    try {
      setIsUpdating(true);
      
      // Update topic status to struggling with 25% mastery
      await updateTopicProgress(topic.id, 'struggling', 25);
      
      // Update local state
      setCurrentMasteryScore(25);
      
      toast.success('Topic marked as struggling. We\'ll provide additional resources and support.');
    } catch (err) {
      console.error('Error marking topic as struggling:', err);
      toast.error('Failed to update topic status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <Card className={cn("p-6", className)}>
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        
        <div>
          <h3 className={cn(commonStyles.heading.h3)}>
            {topic.name}
          </h3>
          <p className="text-gray-600">
            {formatTime(topic.estimatedTimeToComplete)} • {currentMasteryScore}% mastery
          </p>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
        <button
          className={cn(
            "flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
            activeTab === 'overview' 
              ? "bg-white shadow-sm text-primary-700" 
              : "text-gray-600 hover:text-gray-900"
          )}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={cn(
            "flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
            activeTab === 'resources' 
              ? "bg-white shadow-sm text-primary-700" 
              : "text-gray-600 hover:text-gray-900"
          )}
          onClick={() => setActiveTab('resources')}
        >
          Resources ({topic.resources.length})
        </button>
        <button
          className={cn(
            "flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
            activeTab === 'assessments' 
              ? "bg-white shadow-sm text-primary-700" 
              : "text-gray-600 hover:text-gray-900"
          )}
          onClick={() => setActiveTab('assessments')}
        >
          Assessments ({topic.assessments.length})
        </button>
      </div>
      
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Topic Description</h4>
            <p className="text-gray-700">{topic.description}</p>
          </div>
          
          {/* Mastery Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Mastery Progress</h4>
              <span className="text-sm text-gray-600">{currentMasteryScore}%</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  currentMasteryScore >= 80 ? "bg-green-500" :
                  currentMasteryScore >= 50 ? "bg-blue-500" :
                  "bg-amber-500"
                )}
                style={{ width: `${currentMasteryScore}%` }}
              ></div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant={topic.status === 'struggling' ? "primary" : "outline"}
                size="sm"
                onClick={handleMarkAsStruggling}
                isLoading={isUpdating}
                leftIcon={<AlertTriangle className="h-4 w-4" />}
              >
                Mark as Struggling
              </Button>
              
              <Button
                variant={topic.status === 'in_progress' ? "primary" : "outline"}
                size="sm"
                onClick={handleMarkAsInProgress}
                isLoading={isUpdating}
                leftIcon={<Play className="h-4 w-4" />}
              >
                Mark as In Progress
              </Button>
              
              <Button
                variant={topic.status === 'completed' ? "primary" : "outline"}
                size="sm"
                onClick={handleMarkAsCompleted}
                isLoading={isUpdating}
                leftIcon={<CheckCircle className="h-4 w-4" />}
              >
                Mark as Completed
              </Button>
            </div>
          </div>
          
          {/* Prerequisites */}
          {topic.prerequisites.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Prerequisites</h4>
              <div className="space-y-2">
                {topic.prerequisites.map((prereq, index) => (
                  <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <BookOpen className="h-5 w-5 text-gray-500" />
                      <span className="text-gray-700">{prereq}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Estimated Time</span>
              </div>
              <p className="text-lg font-semibold text-blue-900">{formatTime(topic.estimatedTimeToComplete)}</p>
            </div>
            
            <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <BarChart className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Resources</span>
              </div>
              <p className="text-lg font-semibold text-green-900">{topic.resources.length} available</p>
            </div>
          </div>
          
          {/* Study Now Button */}
          <Button
            variant="primary"
            className="w-full"
            onClick={() => setActiveTab('resources')}
            rightIcon={<ArrowRight className="h-5 w-5" />}
          >
            Start Studying This Topic
          </Button>
        </div>
      )}
      
      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium text-blue-900">Learning Resources</h4>
            </div>
            <p className="text-sm text-blue-700">
              These resources are tailored to your learning style and the current topic. 
              Use them in the recommended order for the best learning experience.
            </p>
          </div>
          
          {topic.resources.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-500 mb-1">No Resources Available</h4>
              <p className="text-sm text-gray-400">
                This topic doesn't have any resources yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {topic.resources.map((resource, index) => (
                <div key={resource.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg mt-1">
                        {getResourceIcon(resource.type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="font-medium text-gray-900">{resource.title}</h5>
                          <div className="flex items-center space-x-2">
                            <span className={cn(
                              "px-2 py-0.5 text-xs rounded-full border",
                              getResourceTypeColor(resource.type)
                            )}>
                              {resource.type}
                            </span>
                            
                            <span className={cn(
                              "px-2 py-0.5 text-xs rounded-full border",
                              getLearningStyleColor(resource.learningStyle)
                            )}>
                              {resource.learningStyle}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            <span>{formatTime(resource.estimatedTimeToComplete)}</span>
                            
                            <span className="mx-2">•</span>
                            
                            <span>{resource.difficultyLevel} level</span>
                          </div>
                          
                          {resource.url && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => window.open(resource.url, '_blank')}
                              rightIcon={<ArrowRight className="h-4 w-4" />}
                            >
                              Access Resource
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Assessments Tab */}
      {activeTab === 'assessments' && (
        <div className="space-y-6">
          <div className="p-4 bg-green-50 border border-green-100 rounded-lg mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <Award className="h-5 w-5 text-green-600" />
              <h4 className="font-medium text-green-900">Assessments</h4>
            </div>
            <p className="text-sm text-green-700">
              Complete these assessments to test your understanding of the topic. 
              Your results will help us personalize your learning experience.
            </p>
          </div>
          
          {topic.assessments.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-500 mb-1">No Assessments Available</h4>
              <p className="text-sm text-gray-400">
                This topic doesn't have any assessments yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {topic.assessments.map((assessment) => (
                <div key={assessment.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg mt-1">
                        <Award className="h-5 w-5 text-green-600" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="font-medium text-gray-900">{assessment.title}</h5>
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full border border-green-200">
                            {assessment.type}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{assessment.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-xs text-gray-500">
                            <span>{assessment.questions.length} questions</span>
                            
                            <span className="mx-2">•</span>
                            
                            <span>Passing score: {assessment.passingScore}%</span>
                            
                            {assessment.timeLimit && (
                              <>
                                <span className="mx-2">•</span>
                                <Clock className="h-3.5 w-3.5 mr-1" />
                                <span>{assessment.timeLimit} min</span>
                              </>
                            )}
                          </div>
                          
                          <Button
                            variant="primary"
                            size="sm"
                            rightIcon={<ArrowRight className="h-4 w-4" />}
                          >
                            Start Assessment
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default TopicDetailView;