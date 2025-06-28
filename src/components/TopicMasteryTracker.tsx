import React from 'react';
import { Card } from './Card';
import { cn, commonStyles } from '../styles/utils';
import { 
  BookOpen, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  ArrowRight
} from 'lucide-react';
import { Button } from './Button';

interface TopicMasteryTrackerProps {
  topicsAnalysis: {
    mastered: string[];
    inProgress: string[];
    struggling: string[];
    recommended: string[];
  };
  subject: string;
  className?: string;
}

export const TopicMasteryTracker: React.FC<TopicMasteryTrackerProps> = ({ 
  topicsAnalysis,
  subject,
  className
}) => {
  // Generate mastery percentage for each topic
  const getMasteryPercentage = (topic: string, status: 'mastered' | 'inProgress' | 'struggling') => {
    switch (status) {
      case 'mastered':
        return 100;
      case 'inProgress':
        return Math.floor(Math.random() * 30) + 50; // 50-80%
      case 'struggling':
        return Math.floor(Math.random() * 30) + 10; // 10-40%
      default:
        return 0;
    }
  };
  
  // Get all topics with their status
  const getAllTopics = () => {
    const result = [
      ...topicsAnalysis.mastered.map(topic => ({ 
        name: topic, 
        status: 'mastered' as const,
        mastery: getMasteryPercentage(topic, 'mastered')
      })),
      ...topicsAnalysis.inProgress.map(topic => ({ 
        name: topic, 
        status: 'inProgress' as const,
        mastery: getMasteryPercentage(topic, 'inProgress')
      })),
      ...topicsAnalysis.struggling.map(topic => ({ 
        name: topic, 
        status: 'struggling' as const,
        mastery: getMasteryPercentage(topic, 'struggling')
      }))
    ];
    
    // Sort by mastery (highest first)
    return result.sort((a, b) => b.mastery - a.mastery);
  };
  
  const allTopics = getAllTopics();
  
  return (
    <Card className={cn("p-6", className)}>
      <h3 className={cn(commonStyles.heading.h3, "mb-6")}>
        Topic Mastery Tracker
      </h3>
      
      {allTopics.length === 0 && topicsAnalysis.recommended.length === 0 ? (
        <div className="text-center py-8">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-500 mb-1">No topics tracked yet</h4>
          <p className="text-sm text-gray-400">
            Continue learning to build your topic mastery data
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Mastery Progress */}
          {allTopics.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Your Progress in {subject}</h4>
              <div className="space-y-4">
                {allTopics.map((topic, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-700">{topic.name}</span>
                        {topic.status === 'mastered' && (
                          <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                            Mastered
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">{topic.mastery}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full",
                          topic.status === 'mastered' ? "bg-green-500" :
                          topic.status === 'inProgress' ? "bg-blue-500" :
                          "bg-amber-500"
                        )}
                        style={{ width: `${topic.mastery}%` }}
                      ></div>
                    </div>
                    
                    {topic.status === 'struggling' && (
                      <div className="mt-1 flex items-center text-xs text-amber-600">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        <span>Needs more practice</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Recommended Topics */}
          {topicsAnalysis.recommended.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Recommended Next Topics</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {topicsAnalysis.recommended.slice(0, 4).map((topic, index) => (
                  <div key={index} className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <div className="flex items-start">
                      <div className="p-1.5 bg-blue-100 rounded-full mr-2 mt-0.5">
                        <BookOpen className="h-3.5 w-3.5 text-blue-700" />
                      </div>
                      <div>
                        <h5 className="font-medium text-blue-900 text-sm">{topic}</h5>
                        <p className="text-xs text-blue-700 mt-0.5">
                          Recommended to expand your knowledge
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  View Study Plan
                </Button>
              </div>
            </div>
          )}
          
          {/* Learning Tips */}
          <div className="pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Learning Tips</h4>
            <div className="p-4 bg-primary-50 border border-primary-100 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="p-1.5 bg-primary-100 rounded-full mt-0.5">
                  <Clock className="h-4 w-4 text-primary-700" />
                </div>
                <div>
                  <h5 className="font-medium text-primary-900 text-sm">Spaced Repetition</h5>
                  <p className="text-xs text-primary-700 mt-1">
                    For topics you're struggling with, try reviewing them at increasing intervals:
                    first after 1 day, then 3 days, then 1 week, and finally 2 weeks. This spaced
                    repetition technique is proven to improve long-term retention.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default TopicMasteryTracker;