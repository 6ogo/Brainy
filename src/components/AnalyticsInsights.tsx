import React from 'react';
import { Card } from './Card';
import { cn, commonStyles } from '../styles/utils';
import { 
  TrendingUp, 
  Target, 
  Brain, 
  Clock, 
  Award,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  BarChart,
  BookOpen
} from 'lucide-react';

interface AnalyticsInsightsProps {
  totalStudyTime: number;
  totalConversations: number;
  averageSessionLength: number;
  currentStreak: number;
  totalXP: number;
  weeklyProgress: number[];
}

export const AnalyticsInsights: React.FC<AnalyticsInsightsProps> = ({
  totalStudyTime,
  totalConversations,
  averageSessionLength,
  currentStreak,
  totalXP,
  weeklyProgress
}) => {
  const generateInsights = () => {
    const insights = [];
    
    // Consistency insight
    if (currentStreak >= 7) {
      insights.push({
        type: 'success',
        icon: <CheckCircle className="h-5 w-5" />,
        title: 'Excellent Consistency!',
        description: `You've maintained a ${currentStreak}-day streak. This consistency is key to long-term learning success.`,
        action: 'Keep up the great work!'
      });
    } else if (currentStreak >= 3) {
      insights.push({
        type: 'good',
        icon: <Target className="h-5 w-5" />,
        title: 'Building Momentum',
        description: `${currentStreak} days in a row! You're building a great learning habit.`,
        action: 'Try to reach a 7-day streak for maximum retention.'
      });
    } else {
      insights.push({
        type: 'warning',
        icon: <AlertCircle className="h-5 w-5" />,
        title: 'Focus on Consistency',
        description: 'Regular study sessions lead to better retention and understanding.',
        action: 'Aim for at least 15 minutes of study daily.'
      });
    }

    // Session length insight
    if (averageSessionLength >= 30) {
      insights.push({
        type: 'success',
        icon: <Brain className="h-5 w-5" />,
        title: 'Deep Learning Sessions',
        description: `Your ${averageSessionLength}-minute average sessions show excellent engagement.`,
        action: 'This depth of study leads to better understanding.'
      });
    } else if (averageSessionLength >= 15) {
      insights.push({
        type: 'good',
        icon: <Clock className="h-5 w-5" />,
        title: 'Good Session Length',
        description: `${averageSessionLength} minutes is a solid session length.`,
        action: 'Consider extending to 20-30 minutes for deeper learning.'
      });
    } else {
      insights.push({
        type: 'info',
        icon: <Lightbulb className="h-5 w-5" />,
        title: 'Quick Learning Bursts',
        description: 'Short sessions can be effective for review and practice.',
        action: 'Try longer sessions occasionally for complex topics.'
      });
    }

    // Progress insight
    const recentProgress = weeklyProgress.slice(-2);
    if (recentProgress.length >= 2 && recentProgress[1] > recentProgress[0]) {
      insights.push({
        type: 'success',
        icon: <TrendingUp className="h-5 w-5" />,
        title: 'Accelerating Progress',
        description: 'Your study time has increased this week compared to last week.',
        action: 'You\'re on an upward trajectory!'
      });
    } else if (recentProgress.length >= 2) {
      insights.push({
        type: 'info',
        icon: <BarChart className="h-5 w-5" />,
        title: 'Steady Progress',
        description: 'Your study time has been consistent recently.',
        action: 'Consider setting a goal to increase your weekly study time.'
      });
    }

    // Learning style insight based on patterns
    const learningStyle = determineLearningStyle(totalConversations, averageSessionLength, totalStudyTime);
    insights.push({
      type: 'info',
      icon: <BookOpen className="h-5 w-5" />,
      title: 'Learning Style Analysis',
      description: `Your patterns suggest you're primarily a ${learningStyle} learner.`,
      action: getLearningStyleRecommendation(learningStyle)
    });

    // XP milestone insight
    if (totalXP >= 1000) {
      insights.push({
        type: 'success',
        icon: <Award className="h-5 w-5" />,
        title: 'XP Milestone Achieved',
        description: `${totalXP} XP shows significant learning progress!`,
        action: 'You\'re becoming a true learning champion.'
      });
    }

    return insights.slice(0, 3); // Show top 3 insights
  };

  const determineLearningStyle = (conversations: number, avgSessionLength: number, studyTime: number): string => {
    // This is a simplified algorithm to determine learning style based on usage patterns
    // In a real implementation, this would be more sophisticated and based on actual user behavior
    
    if (conversations > 50 && avgSessionLength < 15) {
      return 'visual';
    } else if (avgSessionLength > 25) {
      return 'auditory';
    } else if (conversations > 30 && studyTime > 600) {
      return 'kinesthetic';
    } else {
      return 'reading/writing';
    }
  };

  const getLearningStyleRecommendation = (style: string): string => {
    switch (style) {
      case 'visual':
        return 'Try using diagrams, charts, and color-coding in your notes.';
      case 'auditory':
        return 'Consider recording explanations and discussing concepts aloud.';
      case 'kinesthetic':
        return 'Incorporate hands-on practice and movement while studying.';
      case 'reading/writing':
        return 'Focus on taking detailed notes and summarizing concepts in writing.';
      default:
        return 'Experiment with different study techniques to find what works best.';
    }
  };

  const insights = generateInsights();

  const getInsightStyle = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'good':
        return 'border-blue-200 bg-blue-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getIconStyle = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600';
      case 'good':
        return 'text-blue-600';
      case 'warning':
        return 'text-yellow-600';
      case 'info':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card className="p-6">
      <h3 className={cn(commonStyles.heading.h3, "mb-6")}>
        Learning Insights
      </h3>
      
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={cn(
              "p-4 rounded-lg border",
              getInsightStyle(insight.type)
            )}
          >
            <div className="flex items-start space-x-3">
              <div className={cn("flex-shrink-0", getIconStyle(insight.type))}>
                {insight.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  {insight.title}
                </h4>
                <p className="text-sm text-gray-700 mb-2">
                  {insight.description}
                </p>
                <p className="text-xs font-medium text-gray-600">
                  💡 {insight.action}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-3">Quick Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Learning Velocity:</span>
            <span className="ml-2 font-medium">
              {totalStudyTime > 0 ? (totalXP / totalStudyTime * 60).toFixed(1) : '0'} XP/hour
            </span>
          </div>
          <div>
            <span className="text-gray-600">Engagement Score:</span>
            <span className="ml-2 font-medium">
              {Math.min(100, Math.round((averageSessionLength / 30) * 100))}%
            </span>
          </div>
          <div>
            <span className="text-gray-600">Consistency Rating:</span>
            <span className="ml-2 font-medium">
              {currentStreak >= 7 ? 'Excellent' : currentStreak >= 3 ? 'Good' : 'Building'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Progress Trend:</span>
            <span className="ml-2 font-medium">
              {weeklyProgress.length >= 2 && weeklyProgress[weeklyProgress.length - 1] > weeklyProgress[weeklyProgress.length - 2] 
                ? '📈 Improving' 
                : '📊 Steady'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};