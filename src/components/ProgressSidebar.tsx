import React, { useEffect, useState } from 'react';
import { Clock, BarChart, BookOpen, TrendingUp } from 'lucide-react';
import { useStore } from '../store/store';
import { useSessionTimer } from '../hooks/useSessionTimer';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface TopicProgress {
  name: string;
  progress: number;
}

export const ProgressSidebar: React.FC = () => {
  const { sessionStats, currentSubject } = useStore();
  const { formattedTime } = useSessionTimer();
  const { user } = useAuth();
  const [topicsProgress, setTopicsProgress] = useState<TopicProgress[]>([]);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchTopicsProgress = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Try to use TavusService for personalized topic suggestions
        const { TavusService } = await import('../services/tavusService');
        if (TavusService && TavusService.getUserLearningProgress) {
          const progress = await TavusService.getUserLearningProgress(user.id, currentSubject);
          // Use TavusService for suggested topics and progress
          // Use completed, struggling, and nextTopics for suggestions
          const allTopics = [
            ...(progress.completedTopics || []),
            ...(progress.strugglingTopics || []),
            ...(progress.nextTopics || []),
            ...(progress.strengths || [])
          ];
          // Remove duplicates
          const uniqueTopics = Array.from(new Set(allTopics));
          setSuggestedTopics(progress.nextTopics?.length ? progress.nextTopics : uniqueTopics.slice(0, 3));
          setTopicsProgress(
            uniqueTopics.slice(0, 3).map((name, idx) => ({
              name,
              progress: idx === 0 ? 80 : idx === 1 ? 40 : 20 // Mocked progress for demo
            }))
          );
          setLoading(false);
          return;
        }
      } catch (error) {
        // If TavusService fails, fallback to old logic below
        console.warn('TavusService unavailable or failed, falling back to local progress logic.', error);
      }
      try {
        // Fallback: local progress logic
        const { data: conversationsData, error: conversationsError } = await supabase
          .from('conversations')
          .select('user_message, ai_response, summary, timestamp')
          .eq('user_id', user.id)
          .ilike('user_message', `%${currentSubject}%`)
          .order('timestamp', { ascending: false })
          .limit(50);
        if (conversationsError) throw conversationsError;
        const subjectTopics = getTopicsForSubject(currentSubject);
        const topicProgressMap = new Map<string, { mentions: number, total: number }>();
        subjectTopics.forEach(topic => {
          topicProgressMap.set(topic, { mentions: 0, total: 0 });
        });
        (conversationsData || []).forEach(conv => {
          const text = `${conv.user_message} ${conv.ai_response} ${conv.summary || ''}`.toLowerCase();
          subjectTopics.forEach(topic => {
            if (text.includes(topic.toLowerCase())) {
              const current = topicProgressMap.get(topic) || { mentions: 0, total: 0 };
              current.mentions += 1;
              current.total += 1;
              topicProgressMap.set(topic, current);
            }
          });
        });
        const progressData = Array.from(topicProgressMap.entries())
          .map(([name, { mentions, total }]) => {
            const progress = total === 0 
              ? Math.floor(Math.random() * 30) + 10
              : Math.min(100, Math.round((mentions / Math.max(1, conversationsData?.length || 1) * 3) * 100));
            return { name, progress };
          })
          .sort((a, b) => b.progress - a.progress);
        setTopicsProgress(progressData.slice(0, 3));
        const lowestProgressTopics = progressData
          .filter(topic => topic.progress < 50)
          .sort((a, b) => a.progress - b.progress)
          .slice(0, 3)
          .map(topic => topic.name);
        if (lowestProgressTopics.length < 3) {
          const remainingTopics = subjectTopics
            .filter(topic => !lowestProgressTopics.includes(topic) && 
                            !progressData.slice(0, 3).some(t => t.name === topic))
            .sort(() => Math.random() - 0.5)
            .slice(0, 3 - lowestProgressTopics.length);
          setSuggestedTopics([...lowestProgressTopics, ...remainingTopics]);
        } else {
          setSuggestedTopics(lowestProgressTopics);
        }
      } catch (error) {
        console.error('Error fetching topics progress:', error);
        setTopicsProgress(getMockTopicsForSubject(currentSubject));
        setSuggestedTopics(getMockSuggestedTopics(currentSubject));
      } finally {
        setLoading(false);
      }
    };
    fetchTopicsProgress();
  }, [user, currentSubject]);
  
  // Get topics for a specific subject
  const getTopicsForSubject = (subject: string): string[] => {
    switch (subject) {
      case 'Math':
        return ['Algebra', 'Calculus', 'Geometry', 'Trigonometry', 'Statistics', 'Probability'];
      case 'Science':
        return ['Physics', 'Chemistry', 'Biology', 'Astronomy', 'Earth Science', 'Ecology'];
      case 'English':
        return ['Grammar', 'Literature', 'Writing', 'Comprehension', 'Poetry', 'Rhetoric'];
      case 'History':
        return ['Ancient History', 'Medieval History', 'Modern History', 'World Wars', 'Civil Rights', 'Cold War'];
      case 'Languages':
        return ['Vocabulary', 'Conjugation', 'Grammar Rules', 'Conversation', 'Reading', 'Writing'];
      default:
        return ['Fundamentals', 'Intermediate Concepts', 'Advanced Topics', 'Problem Solving', 'Applications'];
    }
  };
  
  // Get mock topics for fallback
  const getMockTopicsForSubject = (subject: string): TopicProgress[] => {
    const topics = getTopicsForSubject(subject).slice(0, 3);
    return topics.map(name => ({
      name,
      progress: Math.floor(Math.random() * 60) + 20
    }));
  };
  
  // Get mock suggested topics for fallback
  const getMockSuggestedTopics = (subject: string): string[] => {
    const allTopics = getTopicsForSubject(subject);
    return allTopics.slice(3, 6);
  };
  
  return (
    <div className="p-4 bg-gray-50 border-l border-gray-200">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Session Progress</h2>
      
      <div className="space-y-4">
        {/* Timer */}
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2 text-gray-700 mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Session Duration</span>
          </div>
          <div className="text-2xl font-bold text-primary-700">{formattedTime}</div>
        </div>
        
        {/* Stats */}
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2 text-gray-700 mb-1">
            <BarChart className="h-4 w-4" />
            <span className="text-sm font-medium">Session Stats</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-500">Subject</span>
              <p className="font-medium">{currentSubject}</p>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-500">Messages</span>
              <p className="font-medium">{sessionStats.messagesCount}</p>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-500">XP Earned</span>
              <p className="font-medium">{sessionStats.xpEarned}</p>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-500">Topics</span>
              <p className="font-medium">{topicsProgress.length}</p>
            </div>
          </div>
        </div>
        
        {/* Topic Progress */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <BookOpen className="h-4 w-4 mr-1" />
            Topics Progress
          </h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-2 bg-gray-200 rounded-full"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {topicsProgress.map((topic) => (
                <div key={topic.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{topic.name}</span>
                    <span>{topic.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${topic.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Next Topics */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <TrendingUp className="h-4 w-4 mr-1" />
            Suggested Next Topics
          </h3>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse h-4 bg-gray-200 rounded w-2/3"></div>
              ))}
            </div>
          ) : (
            <ul className="space-y-1">
              {suggestedTopics.map((topic) => (
                <li key={topic} className="text-sm text-primary-700 flex items-center">
                  <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-2"></span>
                  {topic}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};