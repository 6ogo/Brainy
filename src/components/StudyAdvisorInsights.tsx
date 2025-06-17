import React, { useEffect, useState } from 'react';
import { useStore } from '../store/store';
import { useAuth } from '../contexts/AuthContext';
import { Card } from './Card';
import { cn, commonStyles } from '../styles/utils';
import { 
  Brain, 
  Clock, 
  Calendar, 
  BarChart, 
  Lightbulb,
  Target,
  Zap,
  BookOpen
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface StudyPattern {
  dayOfWeek: string;
  timeOfDay: string;
  duration: number;
  productivity: number;
}

interface StudyInsight {
  type: 'strength' | 'improvement' | 'suggestion';
  title: string;
  description: string;
  icon: React.ReactNode;
}

export const StudyAdvisorInsights: React.FC = () => {
  const { socialStats, currentSubject } = useStore();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studyPatterns, setStudyPatterns] = useState<StudyPattern[]>([]);
  const [learningStyle, setLearningStyle] = useState<string>('visual');
  const [insights, setInsights] = useState<StudyInsight[]>([]);
  const [eligibleForAdvice, setEligibleForAdvice] = useState(false);

  useEffect(() => {
    const fetchStudyData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch conversations to analyze study patterns
        const { data: conversations, error: conversationsError } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false })
          .limit(100);
          
        if (conversationsError) throw conversationsError;
        
        // Check if user is eligible for study advisor (5+ sessions)
        const sessionCount = conversations?.length || 0;
        setEligibleForAdvice(sessionCount >= 5);
        
        if (sessionCount < 5) {
          setLoading(false);
          return;
        }
        
        // Analyze study patterns
        const patterns = analyzeStudyPatterns(conversations);
        setStudyPatterns(patterns);
        
        // Determine learning style
        const style = determineLearningStyle(conversations);
        setLearningStyle(style);
        
        // Generate insights
        const generatedInsights = generateInsights(patterns, style, conversations);
        setInsights(generatedInsights);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching study data:', error);
        setLoading(false);
      }
    };
    
    fetchStudyData();
  }, [user]);
  
  // Analyze study patterns from conversation data
  const analyzeStudyPatterns = (conversations: any[]): StudyPattern[] => {
    const patterns: StudyPattern[] = [];
    
    // Group conversations by day of week and time of day
    const dayGroups: Record<string, any[]> = {};
    
    conversations.forEach(conv => {
      const date = new Date(conv.timestamp);
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      const hour = date.getHours();
      let timeOfDay = '';
      
      if (hour >= 5 && hour < 12) timeOfDay = 'Morning';
      else if (hour >= 12 && hour < 17) timeOfDay = 'Afternoon';
      else if (hour >= 17 && hour < 22) timeOfDay = 'Evening';
      else timeOfDay = 'Night';
      
      const key = `${dayOfWeek}-${timeOfDay}`;
      
      if (!dayGroups[key]) {
        dayGroups[key] = [];
      }
      
      dayGroups[key].push(conv);
    });
    
    // Calculate average duration and productivity for each group
    Object.entries(dayGroups).forEach(([key, convs]) => {
      const [dayOfWeek, timeOfDay] = key.split('-');
      
      const totalDuration = convs.reduce((sum, conv) => sum + (conv.duration || 0), 0);
      const avgDuration = convs.length > 0 ? Math.round(totalDuration / convs.length / 60) : 0; // in minutes
      
      // Estimate productivity based on message length and complexity
      const productivity = convs.reduce((sum, conv) => {
        const messageLength = (conv.user_message?.length || 0) + (conv.ai_response?.length || 0);
        const complexity = messageLength > 1000 ? 1.2 : messageLength > 500 ? 1 : 0.8;
        return sum + complexity;
      }, 0) / convs.length * 100;
      
      patterns.push({
        dayOfWeek,
        timeOfDay,
        duration: avgDuration,
        productivity: Math.min(100, Math.round(productivity))
      });
    });
    
    // Sort by productivity (highest first)
    return patterns.sort((a, b) => b.productivity - a.productivity);
  };
  
  // Determine learning style based on conversation patterns
  const determineLearningStyle = (conversations: any[]): string => {
    // Count keywords associated with different learning styles
    let visual = 0, auditory = 0, kinesthetic = 0, reading = 0;
    
    conversations.forEach(conv => {
      const text = (conv.user_message + ' ' + conv.ai_response).toLowerCase();
      
      // Visual keywords
      if (text.includes('see') || text.includes('look') || text.includes('show') || 
          text.includes('picture') || text.includes('image') || text.includes('diagram')) {
        visual++;
      }
      
      // Auditory keywords
      if (text.includes('hear') || text.includes('listen') || text.includes('sound') || 
          text.includes('tell') || text.includes('explain') || text.includes('discuss')) {
        auditory++;
      }
      
      // Kinesthetic keywords
      if (text.includes('feel') || text.includes('touch') || text.includes('do') || 
          text.includes('practice') || text.includes('try') || text.includes('experience')) {
        kinesthetic++;
      }
      
      // Reading/writing keywords
      if (text.includes('read') || text.includes('write') || text.includes('note') || 
          text.includes('text') || text.includes('list') || text.includes('word')) {
        reading++;
      }
    });
    
    // Determine dominant style
    const styles = [
      { name: 'visual', count: visual },
      { name: 'auditory', count: auditory },
      { name: 'kinesthetic', count: kinesthetic },
      { name: 'reading/writing', count: reading }
    ];
    
    const dominantStyle = styles.sort((a, b) => b.count - a.count)[0];
    return dominantStyle.name;
  };
  
  // Generate insights based on study patterns and learning style
  const generateInsights = (patterns: StudyPattern[], style: string, conversations: any[]): StudyInsight[] => {
    const insights: StudyInsight[] = [];
    
    // Best study time insight
    if (patterns.length > 0) {
      const bestPattern = patterns[0];
      insights.push({
        type: 'strength',
        title: 'Optimal Study Time',
        description: `You're most productive studying on ${bestPattern.dayOfWeek} ${bestPattern.timeOfDay.toLowerCase()}.`,
        icon: <Clock className="h-5 w-5 text-green-600" />
      });
    }
    
    // Learning style insight
    insights.push({
      type: 'strength',
      title: 'Learning Style',
      description: `You're primarily a ${style} learner. ${getLearningStyleTip(style)}`,
      icon: <Brain className="h-5 w-5 text-blue-600" />
    });
    
    // Study duration insight
    const avgDuration = patterns.reduce((sum, p) => sum + p.duration, 0) / Math.max(1, patterns.length);
    if (avgDuration < 30) {
      insights.push({
        type: 'improvement',
        title: 'Session Duration',
        description: 'Your study sessions are relatively short. Consider extending them for deeper learning.',
        icon: <Target className="h-5 w-5 text-amber-600" />
      });
    } else {
      insights.push({
        type: 'strength',
        title: 'Session Duration',
        description: `Your average session of ${Math.round(avgDuration)} minutes is ideal for focused learning.`,
        icon: <Target className="h-5 w-5 text-green-600" />
      });
    }
    
    // Consistency insight
    if (socialStats.streak.current < 3) {
      insights.push({
        type: 'improvement',
        title: 'Consistency',
        description: 'Try to study more regularly to build a stronger learning habit.',
        icon: <Calendar className="h-5 w-5 text-amber-600" />
      });
    } else {
      insights.push({
        type: 'strength',
        title: 'Consistency',
        description: `Your ${socialStats.streak.current}-day streak shows excellent learning consistency.`,
        icon: <Calendar className="h-5 w-5 text-green-600" />
      });
    }
    
    // Subject-specific insight
    const subjectMentions = countSubjectMentions(conversations);
    const mostStudiedSubject = Object.entries(subjectMentions)
      .sort(([, a], [, b]) => b - a)[0];
      
    if (mostStudiedSubject) {
      insights.push({
        type: 'suggestion',
        title: 'Subject Focus',
        description: `You've focused most on ${mostStudiedSubject[0]}. Consider exploring related topics to deepen your knowledge.`,
        icon: <BookOpen className="h-5 w-5 text-purple-600" />
      });
    }
    
    // Learning velocity insight
    const learningVelocity = calculateLearningVelocity(conversations, socialStats.totalXP);
    if (learningVelocity > 0) {
      insights.push({
        type: 'suggestion',
        title: 'Learning Velocity',
        description: `At your current pace of ${learningVelocity} XP/hour, you'll reach the next level in about ${Math.ceil(1000 / learningVelocity)} hours.`,
        icon: <Zap className="h-5 w-5 text-purple-600" />
      });
    }
    
    return insights;
  };
  
  // Get learning style tip
  const getLearningStyleTip = (style: string): string => {
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
  
  // Count subject mentions in conversations
  const countSubjectMentions = (conversations: any[]): Record<string, number> => {
    const subjects: Record<string, number> = {
      'Math': 0,
      'Science': 0,
      'English': 0,
      'History': 0,
      'Languages': 0
    };
    
    conversations.forEach(conv => {
      const text = (conv.user_message + ' ' + conv.ai_response).toLowerCase();
      
      if (text.includes('math')) subjects['Math']++;
      if (text.includes('science') || text.includes('physics') || text.includes('chemistry')) subjects['Science']++;
      if (text.includes('english') || text.includes('literature')) subjects['English']++;
      if (text.includes('history')) subjects['History']++;
      if (text.includes('language') || text.includes('spanish') || text.includes('french')) subjects['Languages']++;
    });
    
    return subjects;
  };
  
  // Calculate learning velocity (XP per hour)
  const calculateLearningVelocity = (conversations: any[], totalXP: number): number => {
    const totalDuration = conversations.reduce((sum, conv) => sum + (conv.duration || 0), 0);
    const durationHours = totalDuration / 3600; // Convert seconds to hours
    
    return durationHours > 0 ? Math.round(totalXP / durationHours) : 0;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className={cn(commonStyles.heading.h3, "mb-4")}>
          Study Advisor Insights
        </h3>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </Card>
    );
  }

  if (!eligibleForAdvice) {
    return (
      <Card className="p-6">
        <h3 className={cn(commonStyles.heading.h3, "mb-4")}>
          Study Advisor Insights
        </h3>
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-700 mb-2">
            Complete More Study Sessions
          </h4>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Complete at least 5 study sessions to unlock personalized insights about your learning patterns and study habits.
          </p>
          <div className="mt-4 w-48 mx-auto">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-primary-600 h-2.5 rounded-full" 
                style={{ width: `${Math.min(100, (socialStats.achievements.length / 5) * 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.min(5, socialStats.achievements.length)}/5 sessions completed
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className={cn(commonStyles.heading.h3, "mb-4")}>
        Study Advisor Insights
      </h3>
      
      {/* Learning Style */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
            <Brain className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-1">
              Your Learning Style: <span className="capitalize">{learningStyle}</span>
            </h4>
            <p className="text-sm text-blue-700">
              {getLearningStyleTip(learningStyle)}
            </p>
          </div>
        </div>
      </div>
      
      {/* Study Patterns */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
          <BarChart className="h-4 w-4 mr-2 text-primary-600" />
          Your Study Patterns
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {studyPatterns.slice(0, 2).map((pattern, index) => (
            <div 
              key={index}
              className={cn(
                "p-3 rounded-lg border",
                index === 0 ? "bg-green-50 border-green-100" : "bg-gray-50 border-gray-200"
              )}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium text-gray-900">
                  {pattern.dayOfWeek} {pattern.timeOfDay}
                </div>
                <div className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  index === 0 ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"
                )}>
                  {index === 0 ? 'Most Productive' : 'Productive'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Avg. Duration:</span>
                  <span className="ml-1 font-medium">{pattern.duration} min</span>
                </div>
                <div>
                  <span className="text-gray-500">Productivity:</span>
                  <span className="ml-1 font-medium">{pattern.productivity}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Personalized Insights */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
          <Lightbulb className="h-4 w-4 mr-2 text-primary-600" />
          Personalized Insights
        </h4>
        
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div 
              key={index}
              className={cn(
                "p-3 rounded-lg border",
                insight.type === 'strength' ? "bg-green-50 border-green-100" :
                insight.type === 'improvement' ? "bg-amber-50 border-amber-100" :
                "bg-purple-50 border-purple-100"
              )}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {insight.icon}
                </div>
                <div>
                  <h5 className="font-medium text-gray-900 mb-1">{insight.title}</h5>
                  <p className="text-sm text-gray-700">{insight.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};