import React from 'react';
import { Card } from './Card';
import { cn, commonStyles } from '../styles/utils';
import { 
  Brain, 
  Clock, 
  Calendar, 
  BookOpen, 
  Target, 
  Zap,
  TrendingUp,
  Lightbulb
} from 'lucide-react';

interface LearningInsightsSummaryProps {
  analyticsData: any;
  className?: string;
}

export const LearningInsightsSummary: React.FC<LearningInsightsSummaryProps> = ({ 
  analyticsData,
  className
}) => {
  // Generate personalized insights based on analytics data
  const generateInsights = () => {
    const insights = [];
    
    // Learning style insight
    insights.push({
      icon: <Brain className="h-5 w-5 text-blue-600" />,
      title: `You're a ${analyticsData.learningStyle} learner`,
      description: getLearningStyleTip(analyticsData.learningStyle),
      type: 'info'
    });
    
    // Peak study time insight
    insights.push({
      icon: <Clock className="h-5 w-5 text-purple-600" />,
      title: `${analyticsData.peakStudyTime} is your peak study time`,
      description: `You're most productive during the ${analyticsData.peakStudyTime.toLowerCase()}. Schedule important study sessions during this time.`,
      type: 'info'
    });
    
    // Consistency insight
    if (analyticsData.consistencyRating === 'Excellent') {
      insights.push({
        icon: <Calendar className="h-5 w-5 text-green-600" />,
        title: 'Excellent consistency!',
        description: 'Your regular study habit is paying off. This consistency is key to long-term learning success.',
        type: 'success'
      });
    } else if (analyticsData.consistencyRating === 'Good') {
      insights.push({
        icon: <Calendar className="h-5 w-5 text-blue-600" />,
        title: 'Good consistency',
        description: 'You have a fairly consistent study routine. Try to make it even more regular for better results.',
        type: 'info'
      });
    } else {
      insights.push({
        icon: <Calendar className="h-5 w-5 text-amber-600" />,
        title: 'Building consistency',
        description: 'Regular study sessions lead to better retention. Aim for at least 15 minutes of daily study.',
        type: 'warning'
      });
    }
    
    // Topic mastery insight
    if (analyticsData.topicsAnalysis.mastered.length > 0) {
      insights.push({
        icon: <Target className="h-5 w-5 text-green-600" />,
        title: `Mastered: ${analyticsData.topicsAnalysis.mastered[0]}`,
        description: `You've shown strong understanding of ${analyticsData.topicsAnalysis.mastered.length} topics. Great job!`,
        type: 'success'
      });
    }
    
    // Struggling topics insight
    if (analyticsData.topicsAnalysis.struggling.length > 0) {
      insights.push({
        icon: <BookOpen className="h-5 w-5 text-amber-600" />,
        title: `Focus area: ${analyticsData.topicsAnalysis.struggling[0]}`,
        description: `This topic needs more attention. Consider dedicated review sessions.`,
        type: 'warning'
      });
    }
    
    // Session length insight
    if (analyticsData.averageSessionLength >= 30) {
      insights.push({
        icon: <Zap className="h-5 w-5 text-green-600" />,
        title: 'Deep learning sessions',
        description: `Your ${analyticsData.averageSessionLength}-minute average sessions show excellent engagement.`,
        type: 'success'
      });
    } else if (analyticsData.averageSessionLength >= 15) {
      insights.push({
        icon: <Zap className="h-5 w-5 text-blue-600" />,
        title: 'Good session length',
        description: `${analyticsData.averageSessionLength} minutes is a solid session length. Consider extending to 20-30 minutes for deeper learning.`,
        type: 'info'
      });
    } else {
      insights.push({
        icon: <Zap className="h-5 w-5 text-amber-600" />,
        title: 'Short learning bursts',
        description: 'Your sessions are brief. While this works for review, try longer sessions for complex topics.',
        type: 'warning'
      });
    }
    
    // Progress trend insight
    const recentProgress = analyticsData.weeklyProgress.slice(-2);
    if (recentProgress.length >= 2 && recentProgress[1] > recentProgress[0]) {
      insights.push({
        icon: <TrendingUp className="h-5 w-5 text-green-600" />,
        title: 'Accelerating progress',
        description: 'Your study time has increased recently. Keep up this positive momentum!',
        type: 'success'
      });
    }
    
    return insights;
  };
  
  const getLearningStyleTip = (style: string): string => {
    switch (style) {
      case 'visual':
        return 'Try using diagrams, charts, and color-coding in your notes to leverage your visual learning strength.';
      case 'auditory':
        return 'Consider recording explanations and discussing concepts aloud to enhance your auditory learning.';
      case 'kinesthetic':
        return 'Incorporate hands-on practice and movement while studying to maximize your kinesthetic learning style.';
      case 'reading/writing':
        return 'Focus on taking detailed notes and summarizing concepts in writing to support your reading/writing preference.';
      default:
        return 'Experiment with different study techniques to find what works best for you.';
    }
  };
  
  const insights = generateInsights();
  
  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
          <Lightbulb className="h-5 w-5" />
        </div>
        <h3 className={cn(commonStyles.heading.h3)}>
          Learning Insights
        </h3>
      </div>
      
      <div className="space-y-4">
        {insights.slice(0, 3).map((insight, index) => (
          <div
            key={index}
            className={cn(
              "p-4 rounded-lg border",
              insight.type === 'success' ? "border-green-200 bg-green-50" :
              insight.type === 'warning' ? "border-amber-200 bg-amber-50" :
              "border-blue-200 bg-blue-50"
            )}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {insight.icon}
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">
                  {insight.title}
                </h4>
                <p className="text-sm text-gray-700">
                  {insight.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Quick Stats Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Quick Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Learning Style:</span>
            <span className="ml-2 font-medium capitalize">{analyticsData.learningStyle}</span>
          </div>
          <div>
            <span className="text-gray-600">Peak Study Time:</span>
            <span className="ml-2 font-medium">{analyticsData.peakStudyTime}</span>
          </div>
          <div>
            <span className="text-gray-600">Consistency:</span>
            <span className="ml-2 font-medium">{analyticsData.consistencyRating}</span>
          </div>
          <div>
            <span className="text-gray-600">Retention Rate:</span>
            <span className="ml-2 font-medium">{analyticsData.retentionRate}%</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default LearningInsightsSummary;