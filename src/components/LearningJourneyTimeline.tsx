import React from 'react';
import { Card } from './Card';
import { cn, commonStyles } from '../styles/utils';
import { 
  Clock, 
  BookOpen, 
  Award, 
  Star, 
  CheckCircle,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

interface LearningJourneyTimelineProps {
  conversations: any[];
  className?: string;
}

export const LearningJourneyTimeline: React.FC<LearningJourneyTimelineProps> = ({ 
  conversations,
  className
}) => {
  // Group conversations by date
  const groupedConversations = conversations.reduce((groups: Record<string, any[]>, conv) => {
    const date = new Date(conv.timestamp).toISOString().split('T')[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(conv);
    return groups;
  }, {});
  
  // Sort dates in descending order
  const sortedDates = Object.keys(groupedConversations).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );
  
  // Get significant milestones
  const getMilestones = () => {
    const milestones = [];
    
    // First conversation milestone
    if (conversations.length > 0) {
      const firstConv = [...conversations].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )[0];
      
      milestones.push({
        date: new Date(firstConv.timestamp),
        title: 'First Learning Session',
        description: 'You started your learning journey with Brainbud',
        icon: <Star className="h-5 w-5 text-yellow-500" />
      });
    }
    
    // Milestone for reaching 10 conversations
    if (conversations.length >= 10) {
      const tenthConv = [...conversations].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )[9];
      
      milestones.push({
        date: new Date(tenthConv.timestamp),
        title: '10th Learning Session',
        description: 'You completed your 10th learning session',
        icon: <Award className="h-5 w-5 text-blue-500" />
      });
    }
    
    // Milestone for longest session
    const longestSession = [...conversations].sort((a, b) => 
      (b.duration || 0) - (a.duration || 0)
    )[0];
    
    if (longestSession && longestSession.duration > 600) { // > 10 minutes
      milestones.push({
        date: new Date(longestSession.timestamp),
        title: 'Longest Learning Session',
        description: `${Math.round(longestSession.duration / 60)} minute deep dive`,
        icon: <Clock className="h-5 w-5 text-purple-500" />
      });
    }
    
    return milestones;
  };
  
  const milestones = getMilestones();
  
  // Merge milestones with conversation dates
  const timelineItems = [...sortedDates.map(date => ({
    type: 'date',
    date,
    conversations: groupedConversations[date]
  })), ...milestones.map(milestone => ({
    type: 'milestone',
    date: milestone.date.toISOString().split('T')[0],
    milestone
  }))].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  return (
    <Card className={cn("p-6", className)}>
      <h3 className={cn(commonStyles.heading.h3, "mb-6")}>
        Learning Journey
      </h3>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        <div className="space-y-8">
          {timelineItems.map((item, index) => (
            <div key={index} className="relative pl-12">
              {/* Timeline dot */}
              <div className={cn(
                "absolute left-0 w-8 h-8 rounded-full flex items-center justify-center",
                item.type === 'milestone' ? "bg-primary-100" : "bg-gray-100"
              )}>
                {item.type === 'milestone' ? (
                  item.milestone.icon
                ) : (
                  <Calendar className="h-4 w-4 text-gray-500" />
                )}
              </div>
              
              {item.type === 'milestone' ? (
                <div className="p-4 bg-primary-50 border border-primary-100 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-primary-900">{item.milestone.title}</h4>
                    <span className="text-xs text-primary-600">
                      {format(new Date(item.date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <p className="text-sm text-primary-700">{item.milestone.description}</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center mb-3">
                    <h4 className="font-medium text-gray-900">
                      {format(new Date(item.date), 'EEEE, MMMM d, yyyy')}
                    </h4>
                    <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {item.conversations.length} sessions
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {item.conversations.slice(0, 3).map((conv: any, convIndex: number) => (
                      <div key={convIndex} className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center">
                            <BookOpen className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-sm font-medium text-gray-700">
                              {conv.user_message?.substring(0, 40)}
                              {conv.user_message?.length > 40 ? '...' : ''}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {format(new Date(conv.timestamp), 'h:mm a')}
                          </span>
                        </div>
                        
                        {conv.duration > 0 && (
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{Math.round(conv.duration / 60)} min</span>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {item.conversations.length > 3 && (
                      <div className="text-center text-sm text-primary-600">
                        +{item.conversations.length - 3} more sessions this day
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {timelineItems.length === 0 && (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-500 mb-1">No learning sessions yet</h4>
              <p className="text-sm text-gray-400">
                Start a conversation to begin your learning journey
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default LearningJourneyTimeline;