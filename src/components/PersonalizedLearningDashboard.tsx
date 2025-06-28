import React, { useEffect, useState } from 'react';
import { Card } from './Card';
import { cn, commonStyles } from '../styles/utils';
import { 
  BookOpen, 
  Brain, 
  Calendar, 
  Clock, 
  Target, 
  Award,
  Zap,
  ArrowRight,
  BarChart,
  Loader,
  AlertCircle,
  CheckCircle,
  ChevronRight
} from 'lucide-react';
import { Button } from './Button';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../store/store';
import { 
  LearningPath, 
  LearningPathTopic, 
  getUserLearningPaths, 
  generateLearningPath,
  getPersonalizedRecommendations
} from '../services/personalizationService';
import { LearningPathView } from './LearningPathView';
import { TopicDetailView } from './TopicDetailView';
import toast from 'react-hot-toast';

interface PersonalizedLearningDashboardProps {
  className?: string;
}

export const PersonalizedLearningDashboard: React.FC<PersonalizedLearningDashboardProps> = ({
  className
}) => {
  const { user } = useAuth();
  const { currentSubject, difficultyLevel } = useStore();
  
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<LearningPathTopic | null>(null);
  const [recommendations, setRecommendations] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'paths' | 'recommendations'>('paths');
  
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);
  
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load learning paths
      const paths = await getUserLearningPaths(user!.id);
      setLearningPaths(paths);
      
      // Load recommendations
      const recs = await getPersonalizedRecommendations(user!.id);
      setRecommendations(recs);
    } catch (err) {
      console.error('Error loading personalized learning data:', err);
      setError('Failed to load personalized learning data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateLearningPath = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const newPath = await generateLearningPath(user.id, currentSubject, difficultyLevel);
      
      setLearningPaths(prev => [newPath, ...prev]);
      
      toast.success(`Created new learning path for ${currentSubject}`);
    } catch (err) {
      console.error('Error creating learning path:', err);
      toast.error('Failed to create learning path. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTopicSelect = (topic: LearningPathTopic) => {
    setSelectedTopic(topic);
  };
  
  const handleBackToLearningPaths = () => {
    setSelectedTopic(null);
  };
  
  if (loading) {
    return (
      <Card className={cn("p-6 flex flex-col items-center justify-center min-h-[400px]", className)}>
        <Loader className="h-12 w-12 text-primary-500 animate-spin mb-4" />
        <p className="text-gray-600">Loading your personalized learning data...</p>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4 text-center">{error}</p>
          <Button variant="primary" onClick={loadData}>
            Try Again
          </Button>
        </div>
      </Card>
    );
  }
  
  if (selectedTopic) {
    return (
      <TopicDetailView 
        topic={selectedTopic} 
        onBack={handleBackToLearningPaths}
        className={className}
      />
    );
  }
  
  return (
    <div className={className}>
      {/* Header with tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              activeView === 'paths' 
                ? "bg-white shadow-sm text-primary-700" 
                : "text-gray-600 hover:text-gray-900"
            )}
            onClick={() => setActiveView('paths')}
          >
            Learning Paths
          </button>
          <button
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              activeView === 'recommendations' 
                ? "bg-white shadow-sm text-primary-700" 
                : "text-gray-600 hover:text-gray-900"
            )}
            onClick={() => setActiveView('recommendations')}
          >
            Recommendations
          </button>
        </div>
        
        <Button
          variant="primary"
          onClick={handleCreateLearningPath}
          leftIcon={<BookOpen className="h-4 w-4" />}
        >
          Create New Learning Path
        </Button>
      </div>
      
      {activeView === 'paths' ? (
        <div className="space-y-6">
          {learningPaths.length === 0 ? (
            <Card className="p-6 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Learning Paths Yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Create your first personalized learning path to get started. We'll analyze your learning style and preferences to create a customized curriculum.
              </p>
              <Button
                variant="primary"
                onClick={handleCreateLearningPath}
                leftIcon={<BookOpen className="h-4 w-4" />}
              >
                Create Learning Path for {currentSubject}
              </Button>
            </Card>
          ) : (
            <>
              {/* Active Learning Paths */}
              {learningPaths.map((path) => (
                <LearningPathView 
                  key={path.id} 
                  learningPath={path} 
                  onTopicSelect={handleTopicSelect}
                />
              ))}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {!recommendations ? (
            <Card className="p-6 text-center">
              <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Recommendations Yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Continue learning to generate personalized recommendations based on your learning style and progress.
              </p>
              <Button
                variant="primary"
                onClick={() => window.location.href = '/study'}
              >
                Continue Learning
              </Button>
            </Card>
          ) : (
            <>
              {/* Learning Style Recommendations */}
              <Card className="p-6">
                <h3 className={cn(commonStyles.heading.h3, "mb-4")}>
                  Your Learning Style: <span className="capitalize">{recommendations.learningStyle.primaryStyle}</span>
                </h3>
                
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-100 rounded-full mt-0.5">
                      <Brain className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-700 mb-3">
                        You learn best through {recommendations.learningStyle.primaryStyle === 'visual' ? 'visual information like diagrams and videos' : 
                        recommendations.learningStyle.primaryStyle === 'auditory' ? 'listening and speaking' :
                        recommendations.learningStyle.primaryStyle === 'kinesthetic' ? 'hands-on activities and physical movement' :
                        'reading and writing text-based materials'}.
                      </p>
                      
                      <h4 className="font-medium text-blue-800 mb-2">Recommended Study Techniques:</h4>
                      <ul className="space-y-1">
                        {recommendations.learningStyle.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-blue-700">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                
                <h4 className="font-medium text-gray-900 mb-3">Recommended Resource Types</h4>
                <div className="flex flex-wrap gap-2 mb-6">
                  {recommendations.resourceTypes.map((type: string, index: number) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                    >
                      {type}
                    </span>
                  ))}
                </div>
                
                <h4 className="font-medium text-gray-900 mb-3">Recommended Study Techniques</h4>
                <div className="flex flex-wrap gap-2">
                  {recommendations.studyTechniques.map((technique: string, index: number) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                    >
                      {technique}
                    </span>
                  ))}
                </div>
              </Card>
              
              {/* Study Schedule Recommendations */}
              <Card className="p-6">
                <h3 className={cn(commonStyles.heading.h3, "mb-4")}>
                  Optimal Study Schedule
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <Clock className="h-5 w-5 text-purple-600" />
                      <h4 className="font-medium text-purple-900">Best Time to Study</h4>
                    </div>
                    <p className="text-sm text-purple-700">
                      {recommendations.studySchedule.optimalTime}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <Calendar className="h-5 w-5 text-green-600" />
                      <h4 className="font-medium text-green-900">Recommended Frequency</h4>
                    </div>
                    <p className="text-sm text-green-700">
                      {recommendations.studySchedule.recommendedFrequency}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <h4 className="font-medium text-blue-900">Session Duration</h4>
                    </div>
                    <p className="text-sm text-blue-700">
                      {recommendations.studySchedule.recommendedDuration} minutes per session
                    </p>
                  </div>
                </div>
                
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
                  <h4 className="font-medium text-amber-900 mb-3 flex items-center">
                    <Target className="h-5 w-5 mr-2 text-amber-600" />
                    Focus Areas
                  </h4>
                  
                  {recommendations.topicRecommendations.focusAreas.length > 0 ? (
                    <div className="space-y-3">
                      {recommendations.topicRecommendations.focusAreas.map((topic: string, index: number) => (
                        <div key={index} className="flex items-start">
                          <div className="p-1.5 bg-amber-100 rounded-full mr-2 mt-0.5">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-amber-900">{topic}</p>
                            <p className="text-xs text-amber-700">
                              You're struggling with this topic. Focus on mastering the fundamentals.
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-amber-700">
                      No struggling topics identified. Great job!
                    </p>
                  )}
                </div>
              </Card>
              
              {/* Topic Recommendations */}
              <Card className="p-6">
                <h3 className={cn(commonStyles.heading.h3, "mb-4")}>
                  Recommended Topics
                </h3>
                
                <div className="space-y-3 mb-6">
                  {recommendations.topicRecommendations.nextTopics.length > 0 ? (
                    recommendations.topicRecommendations.nextTopics.map((topic: string, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-1.5 bg-primary-100 rounded-full">
                              <BookOpen className="h-4 w-4 text-primary-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{topic}</h4>
                              <p className="text-xs text-gray-500">Recommended next topic</p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">
                      No topic recommendations available yet. Continue learning to generate personalized recommendations.
                    </p>
                  )}
                </div>
                
                {recommendations.topicRecommendations.reviewTopics.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-primary-600" />
                      Topics to Review
                    </h4>
                    
                    <div className="space-y-3">
                      {recommendations.topicRecommendations.reviewTopics.map((topic: string, index: number) => (
                        <div key={index} className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="p-1.5 bg-blue-100 rounded-full">
                                <Clock className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-blue-900">{topic}</h4>
                                <p className="text-xs text-blue-700">Time to review this topic (spaced repetition)</p>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-blue-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PersonalizedLearningDashboard;