import { supabase } from '../lib/supabase';
import { Subject, DifficultyLevel } from '../types';

export interface LearningPreferences {
  userId: string;
  learningStyle: string;
  preferredDifficulty: string;
  preferredPace: string;
  preferredTimeOfDay: string;
  preferredSessionDuration: number;
  preferredSubjects: string[];
  strengths: string[];
  weaknesses: string[];
  goals: string[];
}

export interface LearningResource {
  id: string;
  type: string;
  title: string;
  description: string;
  url?: string;
  content?: string;
  estimatedTimeToComplete: number;
  difficultyLevel: string;
  learningStyle: string;
}

export interface AssessmentQuestion {
  id: string;
  type: string;
  prompt: string;
  options?: string[];
  correctAnswer?: string;
  points: number;
  difficulty: string;
}

export interface Assessment {
  id: string;
  type: string;
  title: string;
  description: string;
  passingScore: number;
  timeLimit?: number;
  questions: AssessmentQuestion[];
}

export interface LearningPathTopic {
  id: string;
  name: string;
  description: string;
  status: string;
  orderIndex: number;
  estimatedTimeToComplete: number;
  prerequisites: string[];
  masteryScore: number;
  lastStudied?: string;
  resources: LearningResource[];
  assessments: Assessment[];
}

export interface LearningPath {
  id: string;
  subject: string;
  difficultyLevel: string;
  completionRate: number;
  estimatedTimeToComplete: number;
  isActive: boolean;
  topics: LearningPathTopic[];
}

// Get user learning preferences
export const getLearningPreferences = async (userId: string): Promise<LearningPreferences> => {
  try {
    const { data, error } = await supabase
      .from('user_learning_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no preferences exist yet, return defaults
      if (error.code === 'PGRST116') {
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
      throw error;
    }

    return {
      userId: data.user_id,
      learningStyle: data.learning_style,
      preferredDifficulty: data.preferred_difficulty,
      preferredPace: data.preferred_pace,
      preferredTimeOfDay: data.preferred_time_of_day,
      preferredSessionDuration: data.preferred_session_duration,
      preferredSubjects: data.preferred_subjects || [],
      strengths: data.strengths || [],
      weaknesses: data.weaknesses || [],
      goals: data.goals || []
    };
  } catch (error) {
    console.error('Error fetching learning preferences:', error);
    throw error;
  }
};

// Save user learning preferences
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
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error saving learning preferences:', error);
    throw error;
  }
};

// Get user learning paths
export const getUserLearningPaths = async (userId: string): Promise<LearningPath[]> => {
  try {
    const { data: pathsData, error: pathsError } = await supabase
      .from('learning_paths')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (pathsError) throw pathsError;

    const paths = pathsData || [];
    const result: LearningPath[] = [];

    for (const path of paths) {
      // Get topics for this path
      const { data: topicsData, error: topicsError } = await supabase
        .from('learning_path_topics')
        .select('*')
        .eq('learning_path_id', path.id)
        .order('order_index', { ascending: true });

      if (topicsError) throw topicsError;

      const topics: LearningPathTopic[] = [];

      for (const topic of topicsData || []) {
        // Get resources for this topic
        const { data: resourcesData, error: resourcesError } = await supabase
          .from('learning_resources')
          .select('*')
          .eq('topic_id', topic.id);

        if (resourcesError) throw resourcesError;

        // Get assessments for this topic
        const { data: assessmentsData, error: assessmentsError } = await supabase
          .from('assessments')
          .select('*')
          .eq('topic_id', topic.id);

        if (assessmentsError) throw assessmentsError;

        const assessments: Assessment[] = [];

        for (const assessment of assessmentsData || []) {
          // Get questions for this assessment
          const { data: questionsData, error: questionsError } = await supabase
            .from('assessment_questions')
            .select('*')
            .eq('assessment_id', assessment.id);

          if (questionsError) throw questionsError;

          assessments.push({
            id: assessment.id,
            type: assessment.type,
            title: assessment.title,
            description: assessment.description,
            passingScore: assessment.passing_score,
            timeLimit: assessment.time_limit,
            questions: (questionsData || []).map(q => ({
              id: q.id,
              type: q.type,
              prompt: q.prompt,
              options: q.options,
              correctAnswer: q.correct_answer,
              points: q.points,
              difficulty: q.difficulty
            }))
          });
        }

        topics.push({
          id: topic.id,
          name: topic.name,
          description: topic.description,
          status: topic.status,
          orderIndex: topic.order_index,
          estimatedTimeToComplete: topic.estimated_time_to_complete,
          prerequisites: topic.prerequisites || [],
          masteryScore: topic.mastery_score,
          lastStudied: topic.last_studied,
          resources: (resourcesData || []).map(r => ({
            id: r.id,
            type: r.type,
            title: r.title,
            description: r.description,
            url: r.url,
            content: r.content,
            estimatedTimeToComplete: r.estimated_time_to_complete,
            difficultyLevel: r.difficulty_level,
            learningStyle: r.learning_style
          })),
          assessments
        });
      }

      result.push({
        id: path.id,
        subject: path.subject,
        difficultyLevel: path.difficulty_level,
        completionRate: path.completion_rate,
        estimatedTimeToComplete: path.estimated_time_to_complete,
        isActive: path.is_active,
        topics
      });
    }

    return result;
  } catch (error) {
    console.error('Error fetching learning paths:', error);
    throw error;
  }
};

// Generate a new learning path
export const generateLearningPath = async (
  userId: string,
  subject: Subject,
  difficultyLevel: DifficultyLevel
): Promise<LearningPath> => {
  try {
    // Create a new learning path
    const { data: pathData, error: pathError } = await supabase
      .from('learning_paths')
      .insert({
        user_id: userId,
        subject,
        difficulty_level: difficultyLevel,
        completion_rate: 0,
        estimated_time_to_complete: 0,
        is_active: true
      })
      .select()
      .single();

    if (pathError) throw pathError;

    // Generate mock topics for the path
    const topics = generateMockTopics(subject, difficultyLevel, pathData.id);

    // Calculate total estimated time
    const totalTime = topics.reduce((sum, topic) => sum + topic.estimatedTimeToComplete, 0);

    // Update the learning path with the total time
    const { error: updateError } = await supabase
      .from('learning_paths')
      .update({
        estimated_time_to_complete: totalTime
      })
      .eq('id', pathData.id);

    if (updateError) throw updateError;

    return {
      id: pathData.id,
      subject,
      difficultyLevel,
      completionRate: 0,
      estimatedTimeToComplete: totalTime,
      isActive: true,
      topics
    };
  } catch (error) {
    console.error('Error generating learning path:', error);
    throw error;
  }
};

// Update topic progress
export const updateTopicProgress = async (
  topicId: string,
  status: string,
  masteryScore: number
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('learning_path_topics')
      .update({
        status,
        mastery_score: masteryScore,
        last_studied: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', topicId);

    if (error) throw error;

    // Update the learning path completion rate
    await updateLearningPathCompletionRate(topicId);
  } catch (error) {
    console.error('Error updating topic progress:', error);
    throw error;
  }
};

// Update learning path completion rate
const updateLearningPathCompletionRate = async (topicId: string): Promise<void> => {
  try {
    // Get the learning path ID for this topic
    const { data: topicData, error: topicError } = await supabase
      .from('learning_path_topics')
      .select('learning_path_id')
      .eq('id', topicId)
      .single();

    if (topicError) throw topicError;

    // Get all topics for this learning path
    const { data: topicsData, error: topicsError } = await supabase
      .from('learning_path_topics')
      .select('status')
      .eq('learning_path_id', topicData.learning_path_id);

    if (topicsError) throw topicsError;

    // Calculate completion rate
    const totalTopics = topicsData.length;
    const completedTopics = topicsData.filter(t => t.status === 'completed').length;
    const completionRate = Math.round((completedTopics / totalTopics) * 100);

    // Update the learning path
    const { error: updateError } = await supabase
      .from('learning_paths')
      .update({
        completion_rate: completionRate,
        updated_at: new Date().toISOString()
      })
      .eq('id', topicData.learning_path_id);

    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error updating learning path completion rate:', error);
    throw error;
  }
};

// Get personalized recommendations
export const getPersonalizedRecommendations = async (userId: string): Promise<any> => {
  try {
    // Get user preferences
    const preferences = await getLearningPreferences(userId);

    // In a real implementation, this would analyze user data and generate personalized recommendations
    // For now, we'll return mock data
    return {
      learningStyle: {
        primaryStyle: preferences.learningStyle,
        recommendations: getLearningStyleRecommendations(preferences.learningStyle)
      },
      resourceTypes: getResourceTypesForLearningStyle(preferences.learningStyle),
      studyTechniques: getStudyTechniquesForLearningStyle(preferences.learningStyle),
      studySchedule: {
        optimalTime: preferences.preferredTimeOfDay,
        recommendedFrequency: getRecommendedFrequency(preferences.preferredPace),
        recommendedDuration: preferences.preferredSessionDuration
      },
      topicRecommendations: {
        nextTopics: getNextTopicsForSubject(preferences.preferredSubjects[0] || 'Math'),
        focusAreas: [],
        reviewTopics: []
      }
    };
  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    throw error;
  }
};

// Helper functions for generating mock data
const generateMockTopics = (
  subject: Subject,
  difficultyLevel: DifficultyLevel,
  learningPathId: string
): LearningPathTopic[] => {
  const topics = getTopicsForSubject(subject, difficultyLevel);
  
  return topics.map((topic, index) => ({
    id: `topic-${index}-${Date.now()}`,
    name: topic.name,
    description: topic.description,
    status: 'not_started',
    orderIndex: index,
    estimatedTimeToComplete: topic.estimatedTime,
    prerequisites: topic.prerequisites || [],
    masteryScore: 0,
    resources: generateMockResources(topic.name, difficultyLevel),
    assessments: generateMockAssessments(topic.name, difficultyLevel)
  }));
};

const generateMockResources = (
  topicName: string,
  difficultyLevel: DifficultyLevel
): LearningResource[] => {
  const resourceTypes = ['video', 'text', 'interactive', 'audio'];
  const learningStyles = ['visual', 'auditory', 'kinesthetic', 'reading/writing'];
  
  return Array.from({ length: Math.floor(Math.random() * 3) + 2 }, (_, i) => {
    const type = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
    const learningStyle = learningStyles[Math.floor(Math.random() * learningStyles.length)];
    
    return {
      id: `resource-${i}-${Date.now()}`,
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Resource for ${topicName}`,
      description: `A ${difficultyLevel.toLowerCase()} level ${type} resource for learning about ${topicName}.`,
      estimatedTimeToComplete: Math.floor(Math.random() * 30) + 10,
      difficultyLevel,
      learningStyle
    };
  });
};

const generateMockAssessments = (
  topicName: string,
  difficultyLevel: DifficultyLevel
): Assessment[] => {
  return Array.from({ length: Math.floor(Math.random() * 2) + 1 }, (_, i) => {
    const type = i === 0 ? 'quiz' : 'practice';
    
    return {
      id: `assessment-${i}-${Date.now()}`,
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} on ${topicName}`,
      description: `Test your knowledge of ${topicName} with this ${difficultyLevel.toLowerCase()} level ${type}.`,
      passingScore: 70,
      timeLimit: type === 'quiz' ? 15 : undefined,
      questions: generateMockQuestions(topicName, difficultyLevel, type)
    };
  });
};

const generateMockQuestions = (
  topicName: string,
  difficultyLevel: DifficultyLevel,
  type: string
): AssessmentQuestion[] => {
  const questionTypes = type === 'quiz' ? ['multiple_choice', 'true_false'] : ['free_response', 'multiple_choice'];
  
  return Array.from({ length: Math.floor(Math.random() * 5) + 3 }, (_, i) => {
    const qType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    
    return {
      id: `question-${i}-${Date.now()}`,
      type: qType,
      prompt: `Question about ${topicName} (${i + 1})`,
      options: qType === 'multiple_choice' ? ['Option A', 'Option B', 'Option C', 'Option D'] : undefined,
      correctAnswer: qType === 'multiple_choice' ? 'Option A' : qType === 'true_false' ? 'True' : undefined,
      points: Math.floor(Math.random() * 3) + 1,
      difficulty: difficultyLevel === 'Elementary' ? 'easy' : 
                 difficultyLevel === 'High School' ? 'medium' : 'hard'
    };
  });
};

const getTopicsForSubject = (subject: Subject, difficultyLevel: DifficultyLevel): any[] => {
  // This would be replaced with a database call in a real implementation
  const topicsBySubject: Record<Subject, Record<DifficultyLevel, any[]>> = {
    'Math': {
      'Elementary': [
        { name: 'Addition and Subtraction', description: 'Learn basic addition and subtraction operations', estimatedTime: 60 },
        { name: 'Multiplication and Division', description: 'Master multiplication tables and basic division', estimatedTime: 90 },
        { name: 'Fractions', description: 'Understand fractions and how to work with them', estimatedTime: 120 }
      ],
      'High School': [
        { name: 'Algebra Fundamentals', description: 'Learn about variables, equations, and algebraic operations', estimatedTime: 120, prerequisites: ['Basic Arithmetic'] },
        { name: 'Linear Equations', description: 'Solve linear equations and understand their applications', estimatedTime: 150, prerequisites: ['Algebra Fundamentals'] },
        { name: 'Quadratic Equations', description: 'Master quadratic equations and their solutions', estimatedTime: 180, prerequisites: ['Linear Equations'] },
        { name: 'Geometry Basics', description: 'Understand points, lines, angles, and basic shapes', estimatedTime: 120 }
      ],
      'College': [
        { name: 'Calculus I: Limits and Derivatives', description: 'Understand limits and learn to calculate derivatives', estimatedTime: 240, prerequisites: ['Algebra', 'Trigonometry'] },
        { name: 'Calculus II: Integration', description: 'Master integration techniques and applications', estimatedTime: 270, prerequisites: ['Calculus I'] },
        { name: 'Linear Algebra', description: 'Study vector spaces, matrices, and linear transformations', estimatedTime: 240 },
        { name: 'Differential Equations', description: 'Solve and apply differential equations', estimatedTime: 270, prerequisites: ['Calculus II'] }
      ],
      'Advanced': [
        { name: 'Real Analysis', description: 'Rigorous study of real numbers and functions', estimatedTime: 300, prerequisites: ['Calculus II'] },
        { name: 'Abstract Algebra', description: 'Study algebraic structures like groups, rings, and fields', estimatedTime: 300, prerequisites: ['Linear Algebra'] },
        { name: 'Topology', description: 'Explore properties preserved under continuous deformations', estimatedTime: 330, prerequisites: ['Real Analysis'] }
      ]
    },
    'Science': {
      'Elementary': [
        { name: 'States of Matter', description: 'Learn about solids, liquids, and gases', estimatedTime: 60 },
        { name: 'The Solar System', description: 'Explore the planets and other objects in our solar system', estimatedTime: 90 },
        { name: 'Basic Biology', description: 'Introduction to living organisms and their characteristics', estimatedTime: 120 }
      ],
      'High School': [
        { name: 'Chemistry Fundamentals', description: 'Learn about atoms, elements, and chemical reactions', estimatedTime: 150 },
        { name: 'Physics Mechanics', description: 'Study motion, forces, and energy', estimatedTime: 180 },
        { name: 'Cell Biology', description: 'Explore the structure and function of cells', estimatedTime: 150 }
      ],
      'College': [
        { name: 'Organic Chemistry', description: 'Study carbon compounds and their reactions', estimatedTime: 240 },
        { name: 'Quantum Mechanics', description: 'Explore the behavior of matter at the atomic scale', estimatedTime: 270 },
        { name: 'Molecular Biology', description: 'Study the molecular basis of biological activity', estimatedTime: 240 }
      ],
      'Advanced': [
        { name: 'Biochemistry', description: 'Study chemical processes within living organisms', estimatedTime: 300 },
        { name: 'Astrophysics', description: 'Explore the physics of stars, galaxies, and the universe', estimatedTime: 330 },
        { name: 'Genetics and Genomics', description: 'Advanced study of genes and genomes', estimatedTime: 300 }
      ]
    },
    'English': {
      'Elementary': [
        { name: 'Basic Grammar', description: 'Learn about nouns, verbs, and sentence structure', estimatedTime: 60 },
        { name: 'Reading Comprehension', description: 'Develop skills to understand and analyze simple texts', estimatedTime: 90 },
        { name: 'Basic Writing', description: 'Learn to write simple paragraphs and stories', estimatedTime: 120 }
      ],
      'High School': [
        { name: 'Advanced Grammar', description: 'Master complex grammatical structures and rules', estimatedTime: 120 },
        { name: 'Literary Analysis', description: 'Learn to analyze and interpret literature', estimatedTime: 150 },
        { name: 'Essay Writing', description: 'Develop skills to write effective essays', estimatedTime: 180 }
      ],
      'College': [
        { name: 'Rhetoric and Composition', description: 'Study persuasive writing and effective communication', estimatedTime: 210 },
        { name: 'Literary Theory', description: 'Explore different approaches to analyzing literature', estimatedTime: 240 },
        { name: 'Creative Writing', description: 'Develop skills in fiction, poetry, and creative non-fiction', estimatedTime: 210 }
      ],
      'Advanced': [
        { name: 'Advanced Literary Criticism', description: 'Apply complex theoretical frameworks to literature', estimatedTime: 270 },
        { name: 'Linguistics', description: 'Study the structure and evolution of language', estimatedTime: 300 },
        { name: 'Professional Writing', description: 'Master writing for professional and academic contexts', estimatedTime: 270 }
      ]
    },
    'History': {
      'Elementary': [
        { name: 'Ancient Civilizations', description: 'Learn about early human societies and civilizations', estimatedTime: 90 },
        { name: 'World Explorers', description: 'Discover famous explorers and their journeys', estimatedTime: 60 },
        { name: 'American History Basics', description: 'Introduction to key events in American history', estimatedTime: 90 }
      ],
      'High School': [
        { name: 'World History: Ancient to Medieval', description: 'Study major civilizations and their development', estimatedTime: 150 },
        { name: 'World History: Renaissance to Modern', description: 'Explore global history from 1500 to present', estimatedTime: 180 },
        { name: 'U.S. History', description: 'Comprehensive study of American history', estimatedTime: 180 }
      ],
      'College': [
        { name: 'European History', description: 'In-depth study of European history and its global impact', estimatedTime: 240 },
        { name: 'Asian History', description: 'Explore the rich history of Asian civilizations', estimatedTime: 210 },
        { name: 'Historical Research Methods', description: 'Learn how historians research and interpret the past', estimatedTime: 180 }
      ],
      'Advanced': [
        { name: 'Historiography', description: 'Study the writing of history and historical theories', estimatedTime: 270 },
        { name: 'Specialized Regional Studies', description: 'In-depth focus on specific regions or time periods', estimatedTime: 300 },
        { name: 'Comparative History', description: 'Analyze historical developments across different societies', estimatedTime: 270 }
      ]
    },
    'Languages': {
      'Elementary': [
        { name: 'Basic Vocabulary', description: 'Learn essential words and phrases', estimatedTime: 60 },
        { name: 'Simple Grammar', description: 'Understand basic sentence structure', estimatedTime: 90 },
        { name: 'Everyday Conversations', description: 'Practice common dialogues and expressions', estimatedTime: 120 }
      ],
      'High School': [
        { name: 'Intermediate Vocabulary', description: 'Expand your vocabulary for various topics', estimatedTime: 150 },
        { name: 'Grammar Structures', description: 'Master more complex grammatical patterns', estimatedTime: 180 },
        { name: 'Reading and Writing', description: 'Develop skills to read and write in the language', estimatedTime: 150 }
      ],
      'College': [
        { name: 'Advanced Communication', description: 'Develop fluency in speaking and listening', estimatedTime: 210 },
        { name: 'Cultural Context', description: 'Understand the cultural aspects of language use', estimatedTime: 180 },
        { name: 'Literature and Media', description: 'Engage with authentic texts and media', estimatedTime: 240 }
      ],
      'Advanced': [
        { name: 'Professional Fluency', description: 'Master language for professional contexts', estimatedTime: 270 },
        { name: 'Translation and Interpretation', description: 'Develop skills to translate between languages', estimatedTime: 300 },
        { name: 'Linguistic Analysis', description: 'Study the structure and evolution of the language', estimatedTime: 270 }
      ]
    },
    'Test Prep': {
      'Elementary': [
        { name: 'Test-Taking Strategies', description: 'Learn basic approaches to standardized tests', estimatedTime: 60 },
        { name: 'Reading Comprehension', description: 'Practice understanding and analyzing passages', estimatedTime: 90 },
        { name: 'Basic Math Review', description: 'Review fundamental math concepts for tests', estimatedTime: 120 }
      ],
      'High School': [
        { name: 'SAT/ACT Math', description: 'Prepare for the math sections of college entrance exams', estimatedTime: 180 },
        { name: 'SAT/ACT English', description: 'Master the verbal and writing sections', estimatedTime: 150 },
        { name: 'Time Management', description: 'Learn strategies to maximize your time during tests', estimatedTime: 90 }
      ],
      'College': [
        { name: 'GRE Quantitative', description: 'Prepare for graduate-level quantitative reasoning', estimatedTime: 210 },
        { name: 'GRE Verbal', description: 'Master vocabulary and reading comprehension for the GRE', estimatedTime: 210 },
        { name: 'GMAT Preparation', description: 'Comprehensive preparation for business school admission tests', estimatedTime: 240 }
      ],
      'Advanced': [
        { name: 'MCAT Preparation', description: 'Intensive preparation for medical school admission tests', estimatedTime: 330 },
        { name: 'LSAT Preparation', description: 'Master logical reasoning and analytical skills for law school admission', estimatedTime: 300 },
        { name: 'Professional Certification Exams', description: 'Prepare for specialized professional certification tests', estimatedTime: 270 }
      ]
    },
    'All': {
      'Elementary': [],
      'High School': [],
      'College': [],
      'Advanced': []
    }
  };

  return topicsBySubject[subject]?.[difficultyLevel] || [];
};

const getLearningStyleRecommendations = (style: string): string[] => {
  switch (style) {
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

const getResourceTypesForLearningStyle = (style: string): string[] => {
  switch (style) {
    case 'visual':
      return ['Video tutorials', 'Infographics', 'Diagrams', 'Animated explanations', 'Visual flashcards'];
    case 'auditory':
      return ['Podcasts', 'Audio lectures', 'Discussion groups', 'Recorded explanations', 'Verbal quizzes'];
    case 'kinesthetic':
      return ['Interactive simulations', 'Hands-on exercises', 'Role-playing activities', 'Physical models', 'Learning games'];
    case 'reading/writing':
      return ['Textbooks', 'Articles', 'Written summaries', 'Essay questions', 'Note-taking exercises'];
    default:
      return ['Mixed media resources', 'Interactive tutorials', 'Comprehensive guides', 'Practice exercises', 'Self-assessments'];
  }
};

const getStudyTechniquesForLearningStyle = (style: string): string[] => {
  switch (style) {
    case 'visual':
      return ['Mind mapping', 'Color coding', 'Visual note-taking', 'Diagram creation', 'Video learning'];
    case 'auditory':
      return ['Recorded review', 'Group discussion', 'Teaching others', 'Audio summarization', 'Verbal repetition'];
    case 'kinesthetic':
      return ['Learning by doing', 'Role play', 'Physical flashcards', 'Study walks', 'Hands-on projects'];
    case 'reading/writing':
      return ['Cornell note-taking', 'Summarization', 'Outlining', 'Rewriting notes', 'Question formulation'];
    default:
      return ['Spaced repetition', 'Active recall', 'Interleaving', 'Pomodoro technique', 'Retrieval practice'];
  }
};

const getRecommendedFrequency = (pace: string): string => {
  switch (pace) {
    case 'slow':
      return '2-3 times per week, longer sessions';
    case 'moderate':
      return '3-4 times per week, medium-length sessions';
    case 'fast':
      return '4-5 times per week, shorter, focused sessions';
    default:
      return '3-4 times per week';
  }
};

const getNextTopicsForSubject = (subject: Subject): string[] => {
  const topicsBySubject: Record<Subject, string[]> = {
    'Math': ['Algebra II', 'Trigonometry', 'Pre-Calculus'],
    'Science': ['Chemical Reactions', 'Forces and Motion', 'Cell Division'],
    'English': ['Literary Analysis', 'Persuasive Writing', 'Research Methods'],
    'History': ['World War II', 'Industrial Revolution', 'Civil Rights Movement'],
    'Languages': ['Intermediate Conversation', 'Reading Comprehension', 'Cultural Context'],
    'Test Prep': ['Practice Tests', 'Time Management Strategies', 'Subject Review']
  };

  return topicsBySubject[subject] || ['Topic 1', 'Topic 2', 'Topic 3'];
};