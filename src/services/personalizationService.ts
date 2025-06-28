import { supabase } from '../lib/supabase';
import { Subject, DifficultyLevel } from '../types';
import { LearningAnalytics } from '../types';
import { getAnalyticsData } from './analytics-service';

export interface LearningPath {
  id: string;
  userId: string;
  subject: Subject;
  difficultyLevel: DifficultyLevel;
  topics: LearningPathTopic[];
  createdAt: Date;
  updatedAt: Date;
  completionRate: number;
  estimatedTimeToComplete: number; // in minutes
  isActive: boolean;
}

export interface LearningPathTopic {
  id: string;
  name: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'struggling';
  order: number;
  estimatedTimeToComplete: number; // in minutes
  prerequisites: string[]; // IDs of prerequisite topics
  resources: LearningResource[];
  assessments: Assessment[];
  masteryScore: number; // 0-100
  lastStudied?: Date;
}

export interface LearningResource {
  id: string;
  type: 'text' | 'video' | 'audio' | 'interactive';
  title: string;
  description: string;
  url?: string;
  content?: string;
  estimatedTimeToComplete: number; // in minutes
  difficultyLevel: DifficultyLevel;
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading/writing';
}

export interface Assessment {
  id: string;
  type: 'quiz' | 'problem_set' | 'essay' | 'project';
  title: string;
  description: string;
  questions: AssessmentQuestion[];
  passingScore: number; // 0-100
  timeLimit?: number; // in minutes
}

export interface AssessmentQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'coding';
  prompt: string;
  options?: string[];
  correctAnswer?: string | string[];
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface LearningPreferences {
  userId: string;
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading/writing';
  preferredDifficulty: DifficultyLevel;
  preferredPace: 'slow' | 'moderate' | 'fast';
  preferredTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  preferredSessionDuration: number; // in minutes
  preferredSubjects: Subject[];
  strengths: string[];
  weaknesses: string[];
  goals: string[];
}

/**
 * Generate a personalized learning path for a user based on their analytics and preferences
 */
export const generateLearningPath = async (
  userId: string,
  subject: Subject,
  difficultyLevel?: DifficultyLevel
): Promise<LearningPath> => {
  try {
    // Get user's analytics data
    const analyticsData = await getAnalyticsData(userId);
    
    // Get user's learning preferences
    const preferences = await getLearningPreferences(userId);
    
    // Use provided difficulty level or default to user's preferred difficulty
    const targetDifficultyLevel = difficultyLevel || preferences.preferredDifficulty;
    
    // Get subject curriculum (topics and their relationships)
    const curriculum = await getSubjectCurriculum(subject, targetDifficultyLevel);
    
    // Analyze user's strengths and weaknesses
    const { mastered, inProgress, struggling, recommended } = analyticsData.topicsAnalysis;
    
    // Generate personalized topic sequence
    const personalizedTopics = generatePersonalizedTopicSequence(
      curriculum,
      mastered,
      inProgress,
      struggling,
      recommended,
      preferences.learningStyle
    );
    
    // Create learning path
    const learningPath: LearningPath = {
      id: crypto.randomUUID(),
      userId,
      subject,
      difficultyLevel: targetDifficultyLevel,
      topics: personalizedTopics,
      createdAt: new Date(),
      updatedAt: new Date(),
      completionRate: 0,
      estimatedTimeToComplete: personalizedTopics.reduce((sum, topic) => sum + topic.estimatedTimeToComplete, 0),
      isActive: true
    };
    
    // Save learning path to database
    await saveLearningPath(learningPath);
    
    return learningPath;
  } catch (error) {
    console.error('Error generating learning path:', error);
    throw new Error('Failed to generate learning path');
  }
};

/**
 * Get user's learning preferences
 */
const getLearningPreferences = async (userId: string): Promise<LearningPreferences> => {
  try {
    // Check if user has existing preferences
    const { data: existingPreferences, error } = await supabase
      .from('user_learning_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    if (existingPreferences) {
      return {
        userId,
        learningStyle: existingPreferences.learning_style || 'visual',
        preferredDifficulty: existingPreferences.preferred_difficulty || 'High School',
        preferredPace: existingPreferences.preferred_pace || 'moderate',
        preferredTimeOfDay: existingPreferences.preferred_time_of_day || 'afternoon',
        preferredSessionDuration: existingPreferences.preferred_session_duration || 30,
        preferredSubjects: existingPreferences.preferred_subjects || ['Math'],
        strengths: existingPreferences.strengths || [],
        weaknesses: existingPreferences.weaknesses || [],
        goals: existingPreferences.goals || []
      };
    }
    
    // Get analytics data to infer preferences
    const analyticsData = await getAnalyticsData(userId);
    
    // Infer learning style from analytics
    const learningStyle = analyticsData.learningStyle as 'visual' | 'auditory' | 'kinesthetic' | 'reading/writing';
    
    // Infer preferred time of day
    const preferredTimeOfDay = analyticsData.peakStudyTime.toLowerCase() as 'morning' | 'afternoon' | 'evening' | 'night';
    
    // Create default preferences
    const defaultPreferences: LearningPreferences = {
      userId,
      learningStyle,
      preferredDifficulty: 'High School',
      preferredPace: 'moderate',
      preferredTimeOfDay,
      preferredSessionDuration: analyticsData.averageSessionLength || 30,
      preferredSubjects: Object.keys(analyticsData.subjectDistribution) as Subject[],
      strengths: analyticsData.topicsAnalysis.mastered,
      weaknesses: analyticsData.topicsAnalysis.struggling,
      goals: []
    };
    
    // Save default preferences
    await saveUserPreferences(defaultPreferences);
    
    return defaultPreferences;
  } catch (error) {
    console.error('Error getting learning preferences:', error);
    
    // Return default preferences if error
    return {
      userId,
      learningStyle: 'visual',
      preferredDifficulty: 'High School',
      preferredPace: 'moderate',
      preferredTimeOfDay: 'afternoon',
      preferredSessionDuration: 30,
      preferredSubjects: ['Math'],
      strengths: [],
      weaknesses: [],
      goals: []
    };
  }
};

/**
 * Save user's learning preferences
 */
export const saveUserPreferences = async (preferences: LearningPreferences): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_learning_preferences')
      .upsert({
        user_id: preferences.userId,
        learning_style: preferences.learningStyle,
        preferred_difficulty: preferences.preferredDifficulty,
        preferred_pace: preferences.preferredPace,
        preferred_time_of_day: preferences.preferredTimeOfDay,
        preferred_session_duration: preferences.preferredSessionDuration,
        preferred_subjects: preferences.preferredSubjects,
        strengths: preferences.strengths,
        weaknesses: preferences.weaknesses,
        goals: preferences.goals,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
    
    if (error) throw error;
  } catch (error) {
    console.error('Error saving learning preferences:', error);
    throw new Error('Failed to save learning preferences');
  }
};

/**
 * Get curriculum for a subject at a specific difficulty level
 */
const getSubjectCurriculum = async (subject: Subject, difficultyLevel: DifficultyLevel) => {
  // This would typically fetch from a database, but we'll use a static mapping for now
  const curriculumMap: Record<Subject, Record<DifficultyLevel, any>> = {
    'Math': {
      'Elementary': getMathCurriculumElementary(),
      'High School': getMathCurriculumHighSchool(),
      'College': getMathCurriculumCollege(),
      'Advanced': getMathCurriculumAdvanced()
    },
    'Science': {
      'Elementary': getScienceCurriculumElementary(),
      'High School': getScienceCurriculumHighSchool(),
      'College': getScienceCurriculumCollege(),
      'Advanced': getScienceCurriculumAdvanced()
    },
    'English': {
      'Elementary': getEnglishCurriculumElementary(),
      'High School': getEnglishCurriculumHighSchool(),
      'College': getEnglishCurriculumCollege(),
      'Advanced': getEnglishCurriculumAdvanced()
    },
    'History': {
      'Elementary': getHistoryCurriculumElementary(),
      'High School': getHistoryCurriculumHighSchool(),
      'College': getHistoryCurriculumCollege(),
      'Advanced': getHistoryCurriculumAdvanced()
    },
    'Languages': {
      'Elementary': getLanguagesCurriculumElementary(),
      'High School': getLanguagesCurriculumHighSchool(),
      'College': getLanguagesCurriculumCollege(),
      'Advanced': getLanguagesCurriculumAdvanced()
    },
    'Test Prep': {
      'Elementary': getTestPrepCurriculumElementary(),
      'High School': getTestPrepCurriculumHighSchool(),
      'College': getTestPrepCurriculumCollege(),
      'Advanced': getTestPrepCurriculumAdvanced()
    }
  };
  
  return curriculumMap[subject][difficultyLevel];
};

/**
 * Generate a personalized sequence of topics based on user's knowledge and learning style
 */
const generatePersonalizedTopicSequence = (
  curriculum: any,
  mastered: string[],
  inProgress: string[],
  struggling: string[],
  recommended: string[],
  learningStyle: string
): LearningPathTopic[] => {
  const topics: LearningPathTopic[] = [];
  
  // Add struggling topics first (highest priority)
  struggling.forEach(topicName => {
    const curriculumTopic = curriculum.find((t: any) => t.name === topicName);
    if (curriculumTopic) {
      topics.push(createTopicFromCurriculum(curriculumTopic, 'struggling', learningStyle));
    }
  });
  
  // Add in-progress topics next
  inProgress.forEach(topicName => {
    const curriculumTopic = curriculum.find((t: any) => t.name === topicName);
    if (curriculumTopic && !topics.some(t => t.name === topicName)) {
      topics.push(createTopicFromCurriculum(curriculumTopic, 'in_progress', learningStyle));
    }
  });
  
  // Add recommended topics next
  recommended.forEach(topicName => {
    const curriculumTopic = curriculum.find((t: any) => t.name === topicName);
    if (curriculumTopic && !topics.some(t => t.name === topicName)) {
      topics.push(createTopicFromCurriculum(curriculumTopic, 'not_started', learningStyle));
    }
  });
  
  // Add remaining curriculum topics that aren't mastered
  curriculum.forEach((curriculumTopic: any) => {
    if (!topics.some(t => t.name === curriculumTopic.name) && 
        !mastered.includes(curriculumTopic.name)) {
      topics.push(createTopicFromCurriculum(curriculumTopic, 'not_started', learningStyle));
    }
  });
  
  // Set topic order
  topics.forEach((topic, index) => {
    topic.order = index + 1;
  });
  
  return topics;
};

/**
 * Create a learning path topic from curriculum data
 */
const createTopicFromCurriculum = (
  curriculumTopic: any, 
  status: 'not_started' | 'in_progress' | 'completed' | 'struggling',
  learningStyle: string
): LearningPathTopic => {
  // Filter resources based on learning style
  const filteredResources = curriculumTopic.resources.filter((resource: any) => {
    // Always include resources that match the learning style
    if (resource.learningStyle === learningStyle) return true;
    
    // Include some resources of other styles for balanced learning
    if (Math.random() < 0.3) return true;
    
    return false;
  });
  
  return {
    id: crypto.randomUUID(),
    name: curriculumTopic.name,
    description: curriculumTopic.description,
    status,
    order: 0, // Will be set later
    estimatedTimeToComplete: curriculumTopic.estimatedTimeToComplete,
    prerequisites: curriculumTopic.prerequisites || [],
    resources: filteredResources,
    assessments: curriculumTopic.assessments || [],
    masteryScore: status === 'completed' ? 100 : status === 'in_progress' ? 50 : status === 'struggling' ? 25 : 0
  };
};

/**
 * Save learning path to database
 */
const saveLearningPath = async (learningPath: LearningPath): Promise<void> => {
  try {
    // First, save the learning path header
    const { error: pathError } = await supabase
      .from('learning_paths')
      .upsert({
        id: learningPath.id,
        user_id: learningPath.userId,
        subject: learningPath.subject,
        difficulty_level: learningPath.difficultyLevel,
        completion_rate: learningPath.completionRate,
        estimated_time_to_complete: learningPath.estimatedTimeToComplete,
        is_active: learningPath.isActive,
        created_at: learningPath.createdAt.toISOString(),
        updated_at: learningPath.updatedAt.toISOString()
      });
    
    if (pathError) throw pathError;
    
    // Then, save each topic
    for (const topic of learningPath.topics) {
      const { error: topicError } = await supabase
        .from('learning_path_topics')
        .upsert({
          id: topic.id,
          learning_path_id: learningPath.id,
          name: topic.name,
          description: topic.description,
          status: topic.status,
          order_index: topic.order,
          estimated_time_to_complete: topic.estimatedTimeToComplete,
          prerequisites: topic.prerequisites,
          mastery_score: topic.masteryScore,
          last_studied: topic.lastStudied?.toISOString()
        });
      
      if (topicError) throw topicError;
      
      // Save resources for this topic
      for (const resource of topic.resources) {
        const { error: resourceError } = await supabase
          .from('learning_resources')
          .upsert({
            id: resource.id,
            topic_id: topic.id,
            type: resource.type,
            title: resource.title,
            description: resource.description,
            url: resource.url,
            content: resource.content,
            estimated_time_to_complete: resource.estimatedTimeToComplete,
            difficulty_level: resource.difficultyLevel,
            learning_style: resource.learningStyle
          });
        
        if (resourceError) throw resourceError;
      }
      
      // Save assessments for this topic
      for (const assessment of topic.assessments) {
        const { error: assessmentError } = await supabase
          .from('assessments')
          .upsert({
            id: assessment.id,
            topic_id: topic.id,
            type: assessment.type,
            title: assessment.title,
            description: assessment.description,
            passing_score: assessment.passingScore,
            time_limit: assessment.timeLimit
          });
        
        if (assessmentError) throw assessmentError;
        
        // Save questions for this assessment
        for (const question of assessment.questions) {
          const { error: questionError } = await supabase
            .from('assessment_questions')
            .upsert({
              id: question.id,
              assessment_id: assessment.id,
              type: question.type,
              prompt: question.prompt,
              options: question.options,
              correct_answer: question.correctAnswer,
              points: question.points,
              difficulty: question.difficulty
            });
          
          if (questionError) throw questionError;
        }
      }
    }
  } catch (error) {
    console.error('Error saving learning path:', error);
    throw new Error('Failed to save learning path');
  }
};

/**
 * Get user's active learning paths
 */
export const getUserLearningPaths = async (userId: string): Promise<LearningPath[]> => {
  try {
    const { data: pathsData, error: pathsError } = await supabase
      .from('learning_paths')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false });
    
    if (pathsError) throw pathsError;
    
    const learningPaths: LearningPath[] = [];
    
    for (const pathData of pathsData || []) {
      // Get topics for this path
      const { data: topicsData, error: topicsError } = await supabase
        .from('learning_path_topics')
        .select('*')
        .eq('learning_path_id', pathData.id)
        .order('order_index', { ascending: true });
      
      if (topicsError) throw topicsError;
      
      const topics: LearningPathTopic[] = [];
      
      for (const topicData of topicsData || []) {
        // Get resources for this topic
        const { data: resourcesData, error: resourcesError } = await supabase
          .from('learning_resources')
          .select('*')
          .eq('topic_id', topicData.id);
        
        if (resourcesError) throw resourcesError;
        
        // Get assessments for this topic
        const { data: assessmentsData, error: assessmentsError } = await supabase
          .from('assessments')
          .select('*')
          .eq('topic_id', topicData.id);
        
        if (assessmentsError) throw assessmentsError;
        
        const assessments: Assessment[] = [];
        
        for (const assessmentData of assessmentsData || []) {
          // Get questions for this assessment
          const { data: questionsData, error: questionsError } = await supabase
            .from('assessment_questions')
            .select('*')
            .eq('assessment_id', assessmentData.id);
          
          if (questionsError) throw questionsError;
          
          assessments.push({
            id: assessmentData.id,
            type: assessmentData.type,
            title: assessmentData.title,
            description: assessmentData.description,
            questions: questionsData || [],
            passingScore: assessmentData.passing_score,
            timeLimit: assessmentData.time_limit
          });
        }
        
        topics.push({
          id: topicData.id,
          name: topicData.name,
          description: topicData.description,
          status: topicData.status,
          order: topicData.order_index,
          estimatedTimeToComplete: topicData.estimated_time_to_complete,
          prerequisites: topicData.prerequisites || [],
          resources: resourcesData || [],
          assessments,
          masteryScore: topicData.mastery_score,
          lastStudied: topicData.last_studied ? new Date(topicData.last_studied) : undefined
        });
      }
      
      learningPaths.push({
        id: pathData.id,
        userId: pathData.user_id,
        subject: pathData.subject,
        difficultyLevel: pathData.difficulty_level,
        topics,
        createdAt: new Date(pathData.created_at),
        updatedAt: new Date(pathData.updated_at),
        completionRate: pathData.completion_rate,
        estimatedTimeToComplete: pathData.estimated_time_to_complete,
        isActive: pathData.is_active
      });
    }
    
    return learningPaths;
  } catch (error) {
    console.error('Error getting user learning paths:', error);
    throw new Error('Failed to get learning paths');
  }
};

/**
 * Update topic status and mastery score
 */
export const updateTopicProgress = async (
  topicId: string,
  status: 'not_started' | 'in_progress' | 'completed' | 'struggling',
  masteryScore: number
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('learning_path_topics')
      .update({
        status,
        mastery_score: masteryScore,
        last_studied: new Date().toISOString()
      })
      .eq('id', topicId);
    
    if (error) throw error;
    
    // Update learning path completion rate
    await updateLearningPathCompletionRate(topicId);
  } catch (error) {
    console.error('Error updating topic progress:', error);
    throw new Error('Failed to update topic progress');
  }
};

/**
 * Update learning path completion rate
 */
const updateLearningPathCompletionRate = async (topicId: string): Promise<void> => {
  try {
    // Get the learning path ID for this topic
    const { data: topicData, error: topicError } = await supabase
      .from('learning_path_topics')
      .select('learning_path_id')
      .eq('id', topicId)
      .single();
    
    if (topicError) throw topicError;
    
    const learningPathId = topicData.learning_path_id;
    
    // Get all topics for this learning path
    const { data: topicsData, error: topicsError } = await supabase
      .from('learning_path_topics')
      .select('status, mastery_score')
      .eq('learning_path_id', learningPathId);
    
    if (topicsError) throw topicsError;
    
    // Calculate completion rate
    const totalTopics = topicsData.length;
    const completedTopics = topicsData.filter((t: any) => t.status === 'completed').length;
    const completionRate = Math.round((completedTopics / totalTopics) * 100);
    
    // Update learning path
    const { error: updateError } = await supabase
      .from('learning_paths')
      .update({
        completion_rate: completionRate,
        updated_at: new Date().toISOString()
      })
      .eq('id', learningPathId);
    
    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error updating learning path completion rate:', error);
    throw new Error('Failed to update learning path completion rate');
  }
};

/**
 * Get next recommended topic for a learning path
 */
export const getNextRecommendedTopic = async (learningPathId: string): Promise<LearningPathTopic | null> => {
  try {
    // Get all topics for this learning path
    const { data: topicsData, error: topicsError } = await supabase
      .from('learning_path_topics')
      .select('*')
      .eq('learning_path_id', learningPathId)
      .order('order_index', { ascending: true });
    
    if (topicsError) throw topicsError;
    
    // First, check for any in-progress topics
    const inProgressTopic = topicsData.find((t: any) => t.status === 'in_progress');
    if (inProgressTopic) {
      return getFullTopic(inProgressTopic);
    }
    
    // Next, check for struggling topics
    const strugglingTopic = topicsData.find((t: any) => t.status === 'struggling');
    if (strugglingTopic) {
      return getFullTopic(strugglingTopic);
    }
    
    // Finally, get the first not-started topic
    const notStartedTopic = topicsData.find((t: any) => t.status === 'not_started');
    if (notStartedTopic) {
      return getFullTopic(notStartedTopic);
    }
    
    // If all topics are completed, return null
    return null;
  } catch (error) {
    console.error('Error getting next recommended topic:', error);
    throw new Error('Failed to get next recommended topic');
  }
};

/**
 * Get full topic data including resources and assessments
 */
const getFullTopic = async (topicData: any): Promise<LearningPathTopic> => {
  try {
    // Get resources for this topic
    const { data: resourcesData, error: resourcesError } = await supabase
      .from('learning_resources')
      .select('*')
      .eq('topic_id', topicData.id);
    
    if (resourcesError) throw resourcesError;
    
    // Get assessments for this topic
    const { data: assessmentsData, error: assessmentsError } = await supabase
      .from('assessments')
      .select('*')
      .eq('topic_id', topicData.id);
    
    if (assessmentsError) throw assessmentsError;
    
    const assessments: Assessment[] = [];
    
    for (const assessmentData of assessmentsData || []) {
      // Get questions for this assessment
      const { data: questionsData, error: questionsError } = await supabase
        .from('assessment_questions')
        .select('*')
        .eq('assessment_id', assessmentData.id);
      
      if (questionsError) throw questionsError;
      
      assessments.push({
        id: assessmentData.id,
        type: assessmentData.type,
        title: assessmentData.title,
        description: assessmentData.description,
        questions: questionsData || [],
        passingScore: assessmentData.passing_score,
        timeLimit: assessmentData.time_limit
      });
    }
    
    return {
      id: topicData.id,
      name: topicData.name,
      description: topicData.description,
      status: topicData.status,
      order: topicData.order_index,
      estimatedTimeToComplete: topicData.estimated_time_to_complete,
      prerequisites: topicData.prerequisites || [],
      resources: resourcesData || [],
      assessments,
      masteryScore: topicData.mastery_score,
      lastStudied: topicData.last_studied ? new Date(topicData.last_studied) : undefined
    };
  } catch (error) {
    console.error('Error getting full topic data:', error);
    throw new Error('Failed to get full topic data');
  }
};

/**
 * Generate a weekly progress report for a user
 */
export const generateWeeklyProgressReport = async (userId: string): Promise<any> => {
  try {
    // Get user's analytics data
    const analyticsData = await getAnalyticsData(userId);
    
    // Get user's active learning paths
    const learningPaths = await getUserLearningPaths(userId);
    
    // Calculate overall progress
    const totalTopics = learningPaths.reduce((sum, path) => sum + path.topics.length, 0);
    const completedTopics = learningPaths.reduce((sum, path) => 
      sum + path.topics.filter(t => t.status === 'completed').length, 0);
    
    const overallProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
    
    // Calculate weekly study time
    const weeklyStudyTime = analyticsData.weeklyProgress.reduce((sum, time) => sum + time, 0);
    
    // Generate report
    return {
      userId,
      generatedAt: new Date(),
      weekStartDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      weekEndDate: new Date(),
      overallProgress,
      weeklyStudyTime,
      learningPaths: learningPaths.map(path => ({
        subject: path.subject,
        difficultyLevel: path.difficultyLevel,
        completionRate: path.completionRate,
        topicsCompleted: path.topics.filter(t => t.status === 'completed').length,
        totalTopics: path.topics.length,
        topicsInProgress: path.topics.filter(t => t.status === 'in_progress').length,
        topicsStruggling: path.topics.filter(t => t.status === 'struggling').length
      })),
      learningStyle: analyticsData.learningStyle,
      consistencyRating: analyticsData.consistencyRating,
      retentionRate: analyticsData.retentionRate,
      recommendations: generateRecommendations(analyticsData, learningPaths)
    };
  } catch (error) {
    console.error('Error generating weekly progress report:', error);
    throw new Error('Failed to generate weekly progress report');
  }
};

/**
 * Generate personalized recommendations based on analytics and learning paths
 */
const generateRecommendations = (analyticsData: any, learningPaths: LearningPath[]): string[] => {
  const recommendations: string[] = [];
  
  // Recommendation based on learning style
  recommendations.push(`Utilize more ${analyticsData.learningStyle} learning resources to match your preferred learning style.`);
  
  // Recommendation based on consistency
  if (analyticsData.consistencyRating === 'Building') {
    recommendations.push('Try to establish a more consistent study routine. Even 15 minutes daily is better than longer, irregular sessions.');
  } else if (analyticsData.consistencyRating === 'Good') {
    recommendations.push('Your consistency is good. Consider increasing your daily study time slightly for even better results.');
  } else {
    recommendations.push('Excellent consistency! Maintain your current study schedule for optimal learning outcomes.');
  }
  
  // Recommendation based on struggling topics
  if (analyticsData.topicsAnalysis.struggling.length > 0) {
    recommendations.push(`Focus on mastering ${analyticsData.topicsAnalysis.struggling[0]} before moving on to more advanced topics.`);
  }
  
  // Recommendation based on peak study time
  recommendations.push(`Schedule your most challenging study sessions during the ${analyticsData.peakStudyTime.toLowerCase()}, when you're most productive.`);
  
  // Recommendation based on retention rate
  if (analyticsData.retentionRate < 70) {
    recommendations.push('Try using spaced repetition techniques to improve your knowledge retention.');
  }
  
  return recommendations;
};

/**
 * Adapt content difficulty based on user performance
 */
export const adaptContentDifficulty = async (
  userId: string,
  topicId: string,
  currentPerformance: number // 0-100
): Promise<DifficultyLevel> => {
  try {
    // Get the current topic
    const { data: topicData, error: topicError } = await supabase
      .from('learning_path_topics')
      .select('mastery_score, learning_path_id')
      .eq('id', topicId)
      .single();
    
    if (topicError) throw topicError;
    
    // Get the learning path
    const { data: pathData, error: pathError } = await supabase
      .from('learning_paths')
      .select('difficulty_level')
      .eq('id', topicData.learning_path_id)
      .single();
    
    if (pathError) throw pathError;
    
    const currentDifficulty = pathData.difficulty_level;
    
    // Determine if difficulty should be adjusted
    let newDifficulty = currentDifficulty;
    
    if (currentPerformance > 90 && currentDifficulty !== 'Advanced') {
      // Increase difficulty if performance is excellent
      newDifficulty = getNextDifficultyLevel(currentDifficulty);
    } else if (currentPerformance < 40 && currentDifficulty !== 'Elementary') {
      // Decrease difficulty if performance is poor
      newDifficulty = getPreviousDifficultyLevel(currentDifficulty);
    }
    
    // Update topic mastery score
    await supabase
      .from('learning_path_topics')
      .update({
        mastery_score: currentPerformance,
        last_studied: new Date().toISOString()
      })
      .eq('id', topicId);
    
    return newDifficulty as DifficultyLevel;
  } catch (error) {
    console.error('Error adapting content difficulty:', error);
    throw new Error('Failed to adapt content difficulty');
  }
};

/**
 * Get the next difficulty level
 */
const getNextDifficultyLevel = (currentLevel: string): DifficultyLevel => {
  const levels: DifficultyLevel[] = ['Elementary', 'High School', 'College', 'Advanced'];
  const currentIndex = levels.indexOf(currentLevel as DifficultyLevel);
  
  if (currentIndex < levels.length - 1) {
    return levels[currentIndex + 1];
  }
  
  return currentLevel as DifficultyLevel;
};

/**
 * Get the previous difficulty level
 */
const getPreviousDifficultyLevel = (currentLevel: string): DifficultyLevel => {
  const levels: DifficultyLevel[] = ['Elementary', 'High School', 'College', 'Advanced'];
  const currentIndex = levels.indexOf(currentLevel as DifficultyLevel);
  
  if (currentIndex > 0) {
    return levels[currentIndex - 1];
  }
  
  return currentLevel as DifficultyLevel;
};

/**
 * Record assessment result
 */
export const recordAssessmentResult = async (
  userId: string,
  assessmentId: string,
  score: number,
  timeSpent: number,
  answers: Record<string, any>
): Promise<void> => {
  try {
    // Save assessment result
    const { error } = await supabase
      .from('assessment_results')
      .insert({
        user_id: userId,
        assessment_id: assessmentId,
        score,
        time_spent: timeSpent,
        answers,
        completed_at: new Date().toISOString()
      });
    
    if (error) throw error;
    
    // Get the assessment to find its topic
    const { data: assessmentData, error: assessmentError } = await supabase
      .from('assessments')
      .select('topic_id, passing_score')
      .eq('id', assessmentId)
      .single();
    
    if (assessmentError) throw assessmentError;
    
    // Update topic status based on assessment result
    const status = score >= assessmentData.passing_score ? 'completed' : score >= assessmentData.passing_score * 0.7 ? 'in_progress' : 'struggling';
    
    await updateTopicProgress(assessmentData.topic_id, status, score);
  } catch (error) {
    console.error('Error recording assessment result:', error);
    throw new Error('Failed to record assessment result');
  }
};

/**
 * Get personalized study recommendations
 */
export const getPersonalizedRecommendations = async (userId: string): Promise<any> => {
  try {
    // Get user's analytics data
    const analyticsData = await getAnalyticsData(userId);
    
    // Get user's learning preferences
    const preferences = await getLearningPreferences(userId);
    
    // Get user's active learning paths
    const learningPaths = await getUserLearningPaths(userId);
    
    // Generate recommendations
    return {
      userId,
      generatedAt: new Date(),
      learningStyle: {
        primaryStyle: analyticsData.learningStyle,
        recommendations: getLearningStyleRecommendations(analyticsData.learningStyle)
      },
      studySchedule: {
        optimalTime: analyticsData.peakStudyTime,
        recommendedDuration: preferences.preferredSessionDuration,
        recommendedFrequency: getRecommendedFrequency(analyticsData.consistencyRating)
      },
      topicRecommendations: {
        focusAreas: analyticsData.topicsAnalysis.struggling,
        nextTopics: analyticsData.topicsAnalysis.recommended,
        reviewTopics: getReviewTopics(learningPaths)
      },
      resourceTypes: getRecommendedResourceTypes(analyticsData.learningStyle),
      studyTechniques: getRecommendedStudyTechniques(analyticsData.learningStyle, analyticsData.retentionRate)
    };
  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    throw new Error('Failed to get personalized recommendations');
  }
};

/**
 * Get learning style recommendations
 */
const getLearningStyleRecommendations = (learningStyle: string): string[] => {
  switch (learningStyle) {
    case 'visual':
      return [
        'Use diagrams, charts, and mind maps',
        'Color-code your notes and materials',
        'Watch educational videos and demonstrations',
        'Visualize concepts and processes in your mind',
        'Use flashcards with images or symbols'
      ];
    case 'auditory':
      return [
        'Record lectures and listen to them again',
        'Read material aloud to yourself',
        'Discuss concepts with others',
        'Use mnemonic devices and rhymes',
        'Listen to educational podcasts or audiobooks'
      ];
    case 'kinesthetic':
      return [
        'Take frequent breaks to move around',
        'Use physical objects to represent concepts',
        'Act out processes or scenarios',
        'Create models or diagrams by hand',
        'Study while standing or walking'
      ];
    case 'reading/writing':
      return [
        'Take detailed notes in your own words',
        'Rewrite key concepts multiple times',
        'Create lists, outlines, and summaries',
        'Use written flashcards for review',
        'Write practice essays or explanations'
      ];
    default:
      return [
        'Experiment with different study techniques',
        'Combine visual, auditory, and hands-on methods',
        'Take notes in different formats',
        'Vary your study environment',
        'Pay attention to which methods help you retain information best'
      ];
  }
};

/**
 * Get recommended frequency based on consistency rating
 */
const getRecommendedFrequency = (consistencyRating: string): string => {
  switch (consistencyRating) {
    case 'Excellent':
      return 'Continue your daily study habit';
    case 'Good':
      return 'Aim for 5-6 days per week';
    case 'Building':
      return 'Start with 3-4 days per week, then gradually increase';
    default:
      return 'Aim for at least 3 days per week';
  }
};

/**
 * Get topics that should be reviewed based on spaced repetition principles
 */
const getReviewTopics = (learningPaths: LearningPath[]): string[] => {
  const reviewTopics: string[] = [];
  const now = new Date();
  
  // Collect topics that were last studied within specific time frames
  learningPaths.forEach(path => {
    path.topics.forEach(topic => {
      if (topic.status === 'completed' && topic.lastStudied) {
        const daysSinceLastStudy = Math.floor((now.getTime() - topic.lastStudied.getTime()) / (1000 * 60 * 60 * 24));
        
        // Apply spaced repetition intervals
        if (daysSinceLastStudy === 1 || daysSinceLastStudy === 3 || daysSinceLastStudy === 7 || daysSinceLastStudy === 14 || daysSinceLastStudy === 30) {
          reviewTopics.push(topic.name);
        }
      }
    });
  });
  
  return reviewTopics;
};

/**
 * Get recommended resource types based on learning style
 */
const getRecommendedResourceTypes = (learningStyle: string): string[] => {
  switch (learningStyle) {
    case 'visual':
      return ['videos', 'diagrams', 'infographics', 'animations', 'mind maps'];
    case 'auditory':
      return ['lectures', 'podcasts', 'discussions', 'audio books', 'recorded explanations'];
    case 'kinesthetic':
      return ['interactive simulations', 'hands-on exercises', 'role-playing activities', 'physical models', 'field trips'];
    case 'reading/writing':
      return ['textbooks', 'articles', 'written summaries', 'essays', 'note-taking exercises'];
    default:
      return ['videos', 'articles', 'interactive exercises', 'discussions', 'practice problems'];
  }
};

/**
 * Get recommended study techniques based on learning style and retention rate
 */
const getRecommendedStudyTechniques = (learningStyle: string, retentionRate: number): string[] => {
  const techniques: string[] = [];
  
  // Add learning style specific techniques
  switch (learningStyle) {
    case 'visual':
      techniques.push('Mind mapping', 'Color coding', 'Visual note-taking');
      break;
    case 'auditory':
      techniques.push('Verbal summarization', 'Group discussions', 'Teaching concepts aloud');
      break;
    case 'kinesthetic':
      techniques.push('Learning by doing', 'Role playing', 'Physical movement while studying');
      break;
    case 'reading/writing':
      techniques.push('Cornell note-taking', 'Written summaries', 'Rewriting key concepts');
      break;
  }
  
  // Add techniques based on retention rate
  if (retentionRate < 70) {
    techniques.push('Spaced repetition', 'Active recall', 'Interleaving');
  }
  
  // Add general effective techniques
  techniques.push('Pomodoro technique', 'Retrieval practice');
  
  return techniques;
};

// Curriculum data generators
const getMathCurriculumElementary = () => [
  {
    name: 'Numbers and Counting',
    description: 'Learn to count and understand basic number concepts',
    estimatedTimeToComplete: 60,
    prerequisites: [],
    resources: [
      {
        id: crypto.randomUUID(),
        type: 'interactive',
        title: 'Counting Games',
        description: 'Interactive games to practice counting',
        estimatedTimeToComplete: 15,
        difficultyLevel: 'Elementary',
        learningStyle: 'kinesthetic'
      },
      {
        id: crypto.randomUUID(),
        type: 'video',
        title: 'Number Basics',
        description: 'Video introduction to numbers',
        estimatedTimeToComplete: 10,
        difficultyLevel: 'Elementary',
        learningStyle: 'visual'
      }
    ],
    assessments: [
      {
        id: crypto.randomUUID(),
        type: 'quiz',
        title: 'Counting Quiz',
        description: 'Test your counting skills',
        questions: [
          {
            id: crypto.randomUUID(),
            type: 'multiple_choice',
            prompt: 'How many apples are in the picture?',
            options: ['3', '4', '5', '6'],
            correctAnswer: '5',
            points: 1,
            difficulty: 'easy'
          }
        ],
        passingScore: 80
      }
    ]
  },
  {
    name: 'Addition and Subtraction',
    description: 'Learn basic addition and subtraction',
    estimatedTimeToComplete: 90,
    prerequisites: ['Numbers and Counting'],
    resources: [
      {
        id: crypto.randomUUID(),
        type: 'interactive',
        title: 'Addition Practice',
        description: 'Interactive exercises for addition',
        estimatedTimeToComplete: 20,
        difficultyLevel: 'Elementary',
        learningStyle: 'kinesthetic'
      },
      {
        id: crypto.randomUUID(),
        type: 'text',
        title: 'Subtraction Explained',
        description: 'Clear explanation of subtraction concepts',
        estimatedTimeToComplete: 15,
        difficultyLevel: 'Elementary',
        learningStyle: 'reading/writing'
      }
    ],
    assessments: [
      {
        id: crypto.randomUUID(),
        type: 'quiz',
        title: 'Addition and Subtraction Quiz',
        description: 'Test your addition and subtraction skills',
        questions: [
          {
            id: crypto.randomUUID(),
            type: 'multiple_choice',
            prompt: 'What is 5 + 3?',
            options: ['7', '8', '9', '10'],
            correctAnswer: '8',
            points: 1,
            difficulty: 'easy'
          }
        ],
        passingScore: 80
      }
    ]
  }
];

const getMathCurriculumHighSchool = () => [
  {
    name: 'Algebra',
    description: 'Learn algebraic concepts and equations',
    estimatedTimeToComplete: 120,
    prerequisites: [],
    resources: [
      {
        id: crypto.randomUUID(),
        type: 'video',
        title: 'Algebra Fundamentals',
        description: 'Video introduction to algebra',
        estimatedTimeToComplete: 30,
        difficultyLevel: 'High School',
        learningStyle: 'visual'
      },
      {
        id: crypto.randomUUID(),
        type: 'text',
        title: 'Algebraic Equations',
        description: 'Comprehensive guide to solving algebraic equations',
        estimatedTimeToComplete: 45,
        difficultyLevel: 'High School',
        learningStyle: 'reading/writing'
      }
    ],
    assessments: [
      {
        id: crypto.randomUUID(),
        type: 'quiz',
        title: 'Algebra Quiz',
        description: 'Test your algebra skills',
        questions: [
          {
            id: crypto.randomUUID(),
            type: 'multiple_choice',
            prompt: 'Solve for x: 2x + 5 = 15',
            options: ['5', '10', '7.5', '5.5'],
            correctAnswer: '5',
            points: 1,
            difficulty: 'medium'
          }
        ],
        passingScore: 70
      }
    ]
  },
  {
    name: 'Geometry',
    description: 'Learn about shapes, angles, and spatial relationships',
    estimatedTimeToComplete: 150,
    prerequisites: ['Algebra'],
    resources: [
      {
        id: crypto.randomUUID(),
        type: 'interactive',
        title: 'Geometry Explorer',
        description: 'Interactive tool to explore geometric concepts',
        estimatedTimeToComplete: 40,
        difficultyLevel: 'High School',
        learningStyle: 'kinesthetic'
      },
      {
        id: crypto.randomUUID(),
        type: 'audio',
        title: 'Geometry Explained',
        description: 'Audio lecture on geometry fundamentals',
        estimatedTimeToComplete: 35,
        difficultyLevel: 'High School',
        learningStyle: 'auditory'
      }
    ],
    assessments: [
      {
        id: crypto.randomUUID(),
        type: 'quiz',
        title: 'Geometry Quiz',
        description: 'Test your geometry knowledge',
        questions: [
          {
            id: crypto.randomUUID(),
            type: 'multiple_choice',
            prompt: 'What is the sum of angles in a triangle?',
            options: ['90°', '180°', '270°', '360°'],
            correctAnswer: '180°',
            points: 1,
            difficulty: 'medium'
          }
        ],
        passingScore: 70
      }
    ]
  }
];

const getMathCurriculumCollege = () => [
  {
    name: 'Calculus',
    description: 'Learn differential and integral calculus',
    estimatedTimeToComplete: 180,
    prerequisites: [],
    resources: [
      {
        id: crypto.randomUUID(),
        type: 'video',
        title: 'Calculus Fundamentals',
        description: 'Video series on calculus concepts',
        estimatedTimeToComplete: 60,
        difficultyLevel: 'College',
        learningStyle: 'visual'
      },
      {
        id: crypto.randomUUID(),
        type: 'text',
        title: 'Calculus Problem Solving',
        description: 'Guide to solving calculus problems',
        estimatedTimeToComplete: 45,
        difficultyLevel: 'College',
        learningStyle: 'reading/writing'
      }
    ],
    assessments: [
      {
        id: crypto.randomUUID(),
        type: 'quiz',
        title: 'Calculus Quiz',
        description: 'Test your calculus knowledge',
        questions: [
          {
            id: crypto.randomUUID(),
            type: 'multiple_choice',
            prompt: 'What is the derivative of x²?',
            options: ['x', '2x', '2x²', 'x²'],
            correctAnswer: '2x',
            points: 1,
            difficulty: 'hard'
          }
        ],
        passingScore: 70
      }
    ]
  },
  {
    name: 'Linear Algebra',
    description: 'Learn about vectors, matrices, and linear transformations',
    estimatedTimeToComplete: 210,
    prerequisites: ['Calculus'],
    resources: [
      {
        id: crypto.randomUUID(),
        type: 'interactive',
        title: 'Matrix Operations',
        description: 'Interactive tool for matrix operations',
        estimatedTimeToComplete: 50,
        difficultyLevel: 'College',
        learningStyle: 'kinesthetic'
      },
      {
        id: crypto.randomUUID(),
        type: 'audio',
        title: 'Linear Algebra Concepts',
        description: 'Audio lectures on linear algebra',
        estimatedTimeToComplete: 60,
        difficultyLevel: 'College',
        learningStyle: 'auditory'
      }
    ],
    assessments: [
      {
        id: crypto.randomUUID(),
        type: 'quiz',
        title: 'Linear Algebra Quiz',
        description: 'Test your linear algebra knowledge',
        questions: [
          {
            id: crypto.randomUUID(),
            type: 'multiple_choice',
            prompt: 'What is the determinant of a 2x2 matrix [[a,b],[c,d]]?',
            options: ['a+d', 'a-d', 'ad-bc', 'ac+bd'],
            correctAnswer: 'ad-bc',
            points: 1,
            difficulty: 'hard'
          }
        ],
        passingScore: 70
      }
    ]
  }
];

const getMathCurriculumAdvanced = () => [
  {
    name: 'Real Analysis',
    description: 'Rigorous study of real numbers and functions',
    estimatedTimeToComplete: 240,
    prerequisites: [],
    resources: [
      {
        id: crypto.randomUUID(),
        type: 'text',
        title: 'Real Analysis Fundamentals',
        description: 'Comprehensive guide to real analysis',
        estimatedTimeToComplete: 90,
        difficultyLevel: 'Advanced',
        learningStyle: 'reading/writing'
      },
      {
        id: crypto.randomUUID(),
        type: 'video',
        title: 'Proof Techniques',
        description: 'Video series on mathematical proofs',
        estimatedTimeToComplete: 60,
        difficultyLevel: 'Advanced',
        learningStyle: 'visual'
      }
    ],
    assessments: [
      {
        id: crypto.randomUUID(),
        type: 'quiz',
        title: 'Real Analysis Quiz',
        description: 'Test your understanding of real analysis',
        questions: [
          {
            id: crypto.randomUUID(),
            type: 'short_answer',
            prompt: 'Define the concept of a limit point.',
            points: 2,
            difficulty: 'hard'
          }
        ],
        passingScore: 70
      }
    ]
  },
  {
    name: 'Abstract Algebra',
    description: 'Study of algebraic structures like groups, rings, and fields',
    estimatedTimeToComplete: 270,
    prerequisites: ['Real Analysis'],
    resources: [
      {
        id: crypto.randomUUID(),
        type: 'text',
        title: 'Group Theory',
        description: 'Comprehensive guide to group theory',
        estimatedTimeToComplete: 100,
        difficultyLevel: 'Advanced',
        learningStyle: 'reading/writing'
      },
      {
        id: crypto.randomUUID(),
        type: 'interactive',
        title: 'Algebraic Structures Explorer',
        description: 'Interactive tool to explore algebraic structures',
        estimatedTimeToComplete: 70,
        difficultyLevel: 'Advanced',
        learningStyle: 'kinesthetic'
      }
    ],
    assessments: [
      {
        id: crypto.randomUUID(),
        type: 'quiz',
        title: 'Abstract Algebra Quiz',
        description: 'Test your understanding of abstract algebra',
        questions: [
          {
            id: crypto.randomUUID(),
            type: 'short_answer',
            prompt: 'Define a group and give an example.',
            points: 2,
            difficulty: 'hard'
          }
        ],
        passingScore: 70
      }
    ]
  }
];

// Placeholder functions for other subjects
const getScienceCurriculumElementary = () => [
  {
    name: 'Plants and Animals',
    description: 'Learn about basic biology concepts',
    estimatedTimeToComplete: 60,
    prerequisites: [],
    resources: [],
    assessments: []
  }
];

const getScienceCurriculumHighSchool = () => [
  {
    name: 'Biology',
    description: 'Study of living organisms',
    estimatedTimeToComplete: 120,
    prerequisites: [],
    resources: [],
    assessments: []
  }
];

const getScienceCurriculumCollege = () => [
  {
    name: 'Organic Chemistry',
    description: 'Study of carbon compounds',
    estimatedTimeToComplete: 180,
    prerequisites: [],
    resources: [],
    assessments: []
  }
];

const getScienceCurriculumAdvanced = () => [
  {
    name: 'Quantum Mechanics',
    description: 'Advanced study of subatomic particles',
    estimatedTimeToComplete: 240,
    prerequisites: [],
    resources: [],
    assessments: []
  }
];

const getEnglishCurriculumElementary = () => [
  {
    name: 'Reading Basics',
    description: 'Learn to read simple texts',
    estimatedTimeToComplete: 60,
    prerequisites: [],
    resources: [],
    assessments: []
  }
];

const getEnglishCurriculumHighSchool = () => [
  {
    name: 'Literature Analysis',
    description: 'Analyze and interpret literary works',
    estimatedTimeToComplete: 120,
    prerequisites: [],
    resources: [],
    assessments: []
  }
];

const getEnglishCurriculumCollege = () => [
  {
    name: 'Advanced Composition',
    description: 'Develop advanced writing skills',
    estimatedTimeToComplete: 180,
    prerequisites: [],
    resources: [],
    assessments: []
  }
];

const getEnglishCurriculumAdvanced = () => [
  {
    name: 'Literary Theory',
    description: 'Study theoretical approaches to literature',
    estimatedTimeToComplete: 240,
    prerequisites: [],
    resources: [],
    assessments: []
  }
];

const getHistoryCurriculumElementary = () => [
  {
    name: 'Community History',
    description: 'Learn about local history',
    estimatedTimeToComplete: 60,
    prerequisites: [],
    resources: [],
    assessments: []
  }
];

const getHistoryCurriculumHighSchool = () => [
  {
    name: 'World History',
    description: 'Study major historical events worldwide',
    estimatedTimeToComplete: 120,
    prerequisites: [],
    resources: [],
    assessments: []
  }
];

const getHistoryCurriculumCollege = () => [
  {
    name: 'Historical Methods',
    description: 'Learn research methods in history',
    estimatedTimeToComplete: 180,
    prerequisites: [],
    resources: [],
    assessments: []
  }
];

const getHistoryCurriculumAdvanced = () => [
  {
    name: 'Historiography',
    description: 'Study the writing of history',
    estimatedTimeToComplete: 240,
    prerequisites: [],
    resources: [],
    assessments: []
  }
];

const getLanguagesCurriculumElementary = () => [
  {
    name: 'Basic Vocabulary',
    description: 'Learn essential words and phrases',
    estimatedTimeToComplete: 60,
    prerequisites: [],
    resources: [],
    assessments: []
  }
];

const getLanguagesCurriculumHighSchool = () => [
  {
    name: 'Grammar and Conversation',
    description: 'Develop grammar skills and conversational ability',
    estimatedTimeToComplete: 120,
    prerequisites: [],
    resources: [],
    assessments: []
  }
];

const getLanguagesCurriculumCollege = () => [
  {
    name: 'Advanced Communication',
    description: 'Develop advanced language skills',
    estimatedTimeToComplete: 180,
    prerequisites: [],
    resources: [],
    assessments: []
  }
];

const getLanguagesCurriculumAdvanced = () => [
  {
    name: 'Literature and Culture',
    description: 'Study literature and cultural aspects of the language',
    estimatedTimeToComplete: 240,
    prerequisites: [],
    resources: [],
    assessments: []
  }
];

const getTestPrepCurriculumElementary = () => [
  {
    name: 'Test-Taking Strategies',
    description: 'Learn basic strategies for taking tests',
    estimatedTimeToComplete: 60,
    prerequisites: [],
    resources: [],
    assessments: []
  }
];

const getTestPrepCurriculumHighSchool = () => [
  {
    name: 'SAT/ACT Preparation',
    description: 'Prepare for standardized college entrance exams',
    estimatedTimeToComplete: 120,
    prerequisites: [],
    resources: [],
    assessments: []
  }
];

const getTestPrepCurriculumCollege = () => [
  {
    name: 'GRE/GMAT Preparation',
    description: 'Prepare for graduate school entrance exams',
    estimatedTimeToComplete: 180,
    prerequisites: [],
    resources: [],
    assessments: []
  }
];

const getTestPrepCurriculumAdvanced = () => [
  {
    name: 'Professional Certification Exams',
    description: 'Prepare for specialized professional certification exams',
    estimatedTimeToComplete: 240,
    prerequisites: [],
    resources: [],
    assessments: []
  }
];