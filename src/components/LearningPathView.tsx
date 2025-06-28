import React, { useState } from 'react';
import { Card } from './Card';
import { cn, commonStyles } from '../styles/utils';
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Play,
  Award,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { Button } from './Button';
import { LearningPath, LearningPathTopic } from '../services/personalizationService';
import { useNavigate } from 'react-router-dom';

interface LearningPathViewProps {
  learningPath: LearningPath;
  onTopicSelect?: (topic: LearningPathTopic) => void;
  className?: string;
}

export const LearningPathView: React.FC<LearningPathViewProps> = ({
  learningPath,
  onTopicSelect,
  className
}) => {
  const [expandedTopics, setExpandedTopics] = useState<string[]>([]);
  const navigate = useNavigate();
  
  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId) 
        : [...prev, topicId]
    );
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'struggling':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Play className="h-4 w-4 text-blue-600" />;
      case 'struggling':
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      default:
        return <BookOpen className="h-4 w-4 text-gray-600" />;
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
  
  const getNextTopic = () => {
    // First check for in-progress topics
    const inProgressTopic = learningPath.topics.find(topic => topic.status === 'in_progress');
    if (inProgressTopic) return inProgressTopic;
    
    // Then check for struggling topics
    const strugglingTopic = learningPath.topics.find(topic => topic.status === 'struggling');
    if (strugglingTopic) return strugglingTopic;
    
    // Finally, get the first not-started topic
    return learningPath.topics.find(topic => topic.status === 'not_started');
  };
  
  const nextTopic = getNextTopic();
  
  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={cn(commonStyles.heading.h3)}>
            {learningPath.subject} Learning Path
          </h3>
          <p className="text-gray-600">
            {learningPath.difficultyLevel} • {learningPath.topics.length} topics
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-600">
            {learningPath.completionRate}% complete
          </div>
          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-500 rounded-full"
              style={{ width: `${learningPath.completionRate}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Next Topic Card */}
      {nextTopic && (
        <div className="mb-6 p-4 bg-primary-50 border border-primary-100 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-primary-900">Continue Learning</h4>
            <span className={cn(
              "px-2 py-0.5 text-xs rounded-full border",
              getStatusColor(nextTopic.status)
            )}>
              {nextTopic.status === 'not_started' ? 'New' : 
               nextTopic.status === 'in_progress' ? 'In Progress' : 
               nextTopic.status === 'struggling' ? 'Needs Review' : 
               'Completed'}
            </span>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg mt-1">
              <BookOpen className="h-5 w-5 text-primary-700" />
            </div>
            <div className="flex-1">
              <h5 className="font-medium text-primary-900 mb-1">{nextTopic.name}</h5>
              <p className="text-sm text-primary-700 mb-3">{nextTopic.description}</p>
              
              <div className="flex items-center text-xs text-primary-600 mb-4">
                <Clock className="h-3.5 w-3.5 mr-1" />
                <span>{formatTime(nextTopic.estimatedTimeToComplete)}</span>
                
                {nextTopic.masteryScore > 0 && (
                  <>
                    <span className="mx-2">•</span>
                    <Award className="h-3.5 w-3.5 mr-1" />
                    <span>{nextTopic.masteryScore}% mastery</span>
                  </>
                )}
                
                {nextTopic.lastStudied && (
                  <>
                    <span className="mx-2">•</span>
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    <span>Last studied {new Date(nextTopic.lastStudied).toLocaleDateString()}</span>
                  </>
                )}
              </div>
              
              <Button
                variant="primary"
                size="sm"
                onClick={() => onTopicSelect?.(nextTopic)}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                {nextTopic.status === 'not_started' ? 'Start Learning' : 
                 nextTopic.status === 'in_progress' ? 'Continue Learning' : 
                 'Review Topic'}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Topics List */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 mb-2">All Topics</h4>
        
        {learningPath.topics.map((topic) => (
          <div key={topic.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <div 
              className={cn(
                "p-4 cursor-pointer hover:bg-gray-50 transition-colors",
                expandedTopics.includes(topic.id) ? "bg-gray-50" : ""
              )}
              onClick={() => toggleTopic(topic.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "p-1.5 rounded-full",
                    topic.status === 'completed' ? "bg-green-100" :
                    topic.status === 'in_progress' ? "bg-blue-100" :
                    topic.status === 'struggling' ? "bg-amber-100" :
                    "bg-gray-100"
                  )}>
                    {getStatusIcon(topic.status)}
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">{topic.name}</h5>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{formatTime(topic.estimatedTimeToComplete)}</span>
                      
                      {topic.masteryScore > 0 && (
                        <>
                          <span className="mx-1">•</span>
                          <span>{topic.masteryScore}% mastery</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={cn(
                    "px-2 py-0.5 text-xs rounded-full border",
                    getStatusColor(topic.status)
                  )}>
                    {topic.status === 'not_started' ? 'Not Started' : 
                     topic.status === 'in_progress' ? 'In Progress' : 
                     topic.status === 'struggling' ? 'Struggling' : 
                     'Completed'}
                  </span>
                  
                  {expandedTopics.includes(topic.id) ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </div>
            </div>
            
            {expandedTopics.includes(topic.id) && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-600 mb-4">{topic.description}</p>
                
                {topic.resources.length > 0 && (
                  <div className="mb-4">
                    <h6 className="text-xs font-medium text-gray-700 uppercase mb-2">Resources</h6>
                    <div className="space-y-2">
                      {topic.resources.slice(0, 3).map((resource) => (
                        <div key={resource.id} className="flex items-start">
                          <div className={cn(
                            "p-1 rounded-full mr-2 mt-0.5",
                            resource.type === 'video' ? "bg-blue-100" :
                            resource.type === 'interactive' ? "bg-green-100" :
                            resource.type === 'audio' ? "bg-purple-100" :
                            "bg-amber-100"
                          )}>
                            {resource.type === 'video' ? (
                              <Play className="h-3 w-3 text-blue-600" />
                            ) : resource.type === 'interactive' ? (
                              <Play className="h-3 w-3 text-green-600" />
                            ) : resource.type === 'audio' ? (
                              <Play className="h-3 w-3 text-purple-600" />
                            ) : (
                              <BookOpen className="h-3 w-3 text-amber-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">{resource.title}</p>
                            <p className="text-xs text-gray-500">{formatTime(resource.estimatedTimeToComplete)} • {resource.learningStyle} learning</p>
                          </div>
                        </div>
                      ))}
                      
                      {topic.resources.length > 3 && (
                        <p className="text-xs text-primary-600">
                          +{topic.resources.length - 3} more resources
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onTopicSelect?.(topic)}
                  className="w-full"
                >
                  {topic.status === 'not_started' ? 'Start Topic' : 
                   topic.status === 'in_progress' ? 'Continue Learning' : 
                   topic.status === 'struggling' ? 'Review Topic' : 
                   'Review Completed Topic'}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default LearningPathView;