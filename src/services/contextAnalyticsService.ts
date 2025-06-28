import { supabase } from '../lib/supabase';

// Cache for analytics data
let analyticsCache: Record<string, { data: any; timestamp: number }> = {};

/**
 * Get context analytics data for a user with caching
 */
export const getContextAnalyticsData = async (
  userId: string,
  timeframe: 'day' | 'week' | 'month' | 'all' = 'week',
  conversationType: 'all' | 'text' | 'voice' | 'video' = 'all',
  contextComplexity: 'all' | 'simple' | 'moderate' | 'complex' = 'all'
): Promise<any> => {
  // Create a cache key based on the parameters
  const cacheKey = `context_analytics_${userId}_${timeframe}_${conversationType}_${contextComplexity}`;
  
  // Check cache first (valid for 5 minutes)
  const now = Date.now();
  const cachedData = analyticsCache[cacheKey];
  
  if (cachedData && now - cachedData.timestamp < 5 * 60 * 1000) {
    return cachedData.data;
  }

  try {
    // In a real implementation, this would fetch data from the database
    // For now, we'll generate mock data
    const data = generateMockContextAnalyticsData(timeframe, conversationType, contextComplexity);
    
    // Cache the results
    analyticsCache[cacheKey] = {
      data,
      timestamp: now
    };
    
    return data;
  } catch (error) {
    console.error('Failed to fetch context analytics data:', error);
    throw error;
  }
};

/**
 * Generate mock context analytics data
 */
const generateMockContextAnalyticsData = (
  timeframe: string,
  conversationType: string,
  contextComplexity: string
) => {
  // Adjust scores based on filters for more realistic data
  const timeframeMultiplier = 
    timeframe === 'day' ? 0.95 :
    timeframe === 'week' ? 0.9 :
    timeframe === 'month' ? 0.85 :
    0.8; // all time has more variance
  
  const typeMultiplier = 
    conversationType === 'text' ? 0.95 :
    conversationType === 'voice' ? 0.85 :
    conversationType === 'video' ? 0.8 :
    0.9; // all types
  
  const complexityMultiplier = 
    contextComplexity === 'simple' ? 0.95 :
    contextComplexity === 'moderate' ? 0.85 :
    contextComplexity === 'complex' ? 0.75 :
    0.85; // all complexity levels
  
  // Base scores adjusted by multipliers
  const baseRetentionScore = Math.round(85 * timeframeMultiplier * typeMultiplier * complexityMultiplier);
  const baseRelevanceScore = Math.round(88 * timeframeMultiplier * typeMultiplier * complexityMultiplier);
  const baseEfficiencyScore = Math.round(82 * timeframeMultiplier * typeMultiplier * complexityMultiplier);
  
  // Generate dates for time-based charts
  const dates = generateDateRange(timeframe);
  
  return {
    overview: {
      contextRetentionScore: baseRetentionScore,
      responseRelevanceScore: baseRelevanceScore,
      memoryEfficiencyScore: baseEfficiencyScore,
      contextSwitchCount: Math.round(15 * (1 / timeframeMultiplier)),
      totalConversations: Math.round(50 * (1 / timeframeMultiplier)),
      averageContextLength: Math.round(1200 * complexityMultiplier)
    },
    
    // Retention over time chart data
    retentionOverTime: dates.map((date, index) => ({
      date,
      retention: Math.max(50, Math.min(98, baseRetentionScore + (Math.random() * 10 - 5)))
    })),
    
    // Metrics by conversation type
    metricsByConversationType: [
      {
        type: 'Text',
        retention: Math.round(baseRetentionScore * 1.05),
        relevance: Math.round(baseRelevanceScore * 1.02),
        efficiency: Math.round(baseEfficiencyScore * 1.08)
      },
      {
        type: 'Voice',
        retention: Math.round(baseRetentionScore * 0.95),
        relevance: Math.round(baseRelevanceScore * 0.98),
        efficiency: Math.round(baseEfficiencyScore * 0.92)
      },
      {
        type: 'Video',
        retention: Math.round(baseRetentionScore * 0.9),
        relevance: Math.round(baseRelevanceScore * 0.95),
        efficiency: Math.round(baseEfficiencyScore * 0.88)
      }
    ],
    
    // Metrics by complexity
    metricsByComplexity: [
      {
        metric: 'Retention',
        simple: Math.round(baseRetentionScore * 1.1),
        moderate: Math.round(baseRetentionScore * 1.0),
        complex: Math.round(baseRetentionScore * 0.85)
      },
      {
        metric: 'Relevance',
        simple: Math.round(baseRelevanceScore * 1.08),
        moderate: Math.round(baseRelevanceScore * 1.0),
        complex: Math.round(baseRelevanceScore * 0.9)
      },
      {
        metric: 'Efficiency',
        simple: Math.round(baseEfficiencyScore * 1.15),
        moderate: Math.round(baseEfficiencyScore * 1.0),
        complex: Math.round(baseEfficiencyScore * 0.8)
      },
      {
        metric: 'Coherence',
        simple: Math.round(90 * timeframeMultiplier * typeMultiplier),
        moderate: Math.round(85 * timeframeMultiplier * typeMultiplier),
        complex: Math.round(75 * timeframeMultiplier * typeMultiplier)
      }
    ],
    
    // Degradation analysis
    degradationByMessageCount: Array.from({ length: 10 }, (_, i) => ({
      messageCount: (i + 1) * 5,
      retention: Math.max(40, Math.round(baseRetentionScore - i * 5))
    })),
    
    degradationByTime: Array.from({ length: 6 }, (_, i) => ({
      timeMinutes: i * 10,
      retention: Math.max(40, Math.round(baseRetentionScore - i * 7))
    })),
    
    // Context issues
    contextIssues: [
      {
        title: 'Topic Drift Detected',
        description: 'Conversation gradually shifted away from the original topic without clear transitions.',
        severity: 'medium',
        recommendation: 'Use explicit topic markers when changing subjects.'
      },
      {
        title: 'Context Window Saturation',
        description: 'Context window approaching maximum capacity, risking loss of earlier conversation details.',
        severity: 'high',
        recommendation: 'Consider summarizing the conversation or starting a new session for new topics.'
      },
      {
        title: 'Effective Reference Handling',
        description: 'System correctly resolved pronouns and references to previous messages.',
        severity: 'low',
        recommendation: 'Continue using clear references to maintain this performance.'
      }
    ],
    
    // Context retention details
    contextRetention: {
      overallScore: baseRetentionScore,
      shortTermScore: Math.min(98, Math.round(baseRetentionScore * 1.1)),
      mediumTermScore: baseRetentionScore,
      longTermScore: Math.round(baseRetentionScore * 0.85),
      
      switchingPatterns: [
        { category: 'Subject Change', count: 12 },
        { category: 'Time Jump', count: 8 },
        { category: 'Person Reference', count: 15 },
        { category: 'Location Change', count: 6 },
        { category: 'Concept Shift', count: 10 }
      ],
      
      accuracyByTopic: [
        { topic: 'Math', accuracy: Math.round(baseRetentionScore * 1.05) },
        { topic: 'Science', accuracy: Math.round(baseRetentionScore * 1.02) },
        { topic: 'History', accuracy: Math.round(baseRetentionScore * 0.95) },
        { topic: 'Languages', accuracy: Math.round(baseRetentionScore * 0.98) },
        { topic: 'Test Prep', accuracy: Math.round(baseRetentionScore * 1.0) }
      ],
      
      factors: [
        { name: 'Message Frequency', impact: 85 },
        { name: 'Conversation Length', impact: 72 },
        { name: 'Topic Complexity', impact: 68 },
        { name: 'Context Switches', impact: 45 },
        { name: 'Time Between Sessions', impact: 38 }
      ],
      
      retentionByType: [
        { type: 'Factual', value: Math.round(baseRetentionScore * 1.08) },
        { type: 'Conceptual', value: Math.round(baseRetentionScore * 0.95) },
        { type: 'Procedural', value: Math.round(baseRetentionScore * 1.02) },
        { type: 'Personal', value: Math.round(baseRetentionScore * 0.9) }
      ],
      
      lossPatterns: [
        {
          pattern: 'Temporal Decay',
          description: 'Context retention decreases significantly after 24 hours of inactivity.',
          severity: 'medium',
          recommendation: 'Provide brief summaries of previous conversations when resuming after long breaks.'
        },
        {
          pattern: 'Topic Overload',
          description: 'Multiple topics introduced in rapid succession leads to context confusion.',
          severity: 'high',
          recommendation: 'Focus on one topic at a time and clearly signal topic transitions.'
        },
        {
          pattern: 'Reference Ambiguity',
          description: 'Unclear pronoun references causing context misinterpretation.',
          severity: 'medium',
          recommendation: 'Use specific nouns instead of pronouns when referring to important concepts.'
        }
      ]
    },
    
    // Memory usage details
    memoryUsage: {
      efficiencyScore: baseEfficiencyScore,
      utilizationRate: Math.round(75 * complexityMultiplier),
      averageContextLength: Math.round(1200 * complexityMultiplier),
      maxContextLength: 4096,
      compressionRate: Math.round((3.5 * complexityMultiplier) * 10) / 10,
      
      usageOverTime: dates.map((timestamp, index) => ({
        timestamp,
        contextLength: Math.round(1000 + (index * 50 * complexityMultiplier)),
        memoryUsage: Math.min(95, Math.round(60 + (index * 3 * complexityMultiplier)))
      })),
      
      contextLengthDistribution: [
        { range: '0-500', count: Math.round(5 * (1 / complexityMultiplier)) },
        { range: '500-1000', count: Math.round(12 * (1 / complexityMultiplier)) },
        { range: '1000-1500', count: Math.round(18 * complexityMultiplier) },
        { range: '1500-2000', count: Math.round(10 * complexityMultiplier) },
        { range: '2000-2500', count: Math.round(5 * complexityMultiplier) },
        { range: '2500+', count: Math.round(2 * complexityMultiplier) }
      ],
      
      optimizationTechniques: [
        { technique: 'Summarization', percentage: 0.35 },
        { technique: 'Key Info Extraction', percentage: 0.25 },
        { technique: 'Redundancy Removal', percentage: 0.20 },
        { technique: 'Semantic Compression', percentage: 0.15 },
        { technique: 'Other', percentage: 0.05 }
      ],
      
      efficiencyInsights: [
        {
          title: 'Effective Summarization',
          description: 'The system effectively summarizes previous context to maintain key information while reducing token usage.',
          metrics: {
            'Compression Ratio': '3.2x',
            'Info Retention': '94%',
            'Token Savings': '68%'
          }
        },
        {
          title: 'Redundancy Detection',
          description: 'Duplicate or highly similar information is being identified and consolidated effectively.',
          metrics: {
            'Redundancy Rate': '18%',
            'Deduplication Success': '92%'
          }
        },
        {
          title: 'Memory Allocation Optimization',
          description: 'System prioritizes recent and relevant information when context window is near capacity.',
          metrics: {
            'Recency Bias': 'Appropriate',
            'Key Info Retention': '96%'
          }
        }
      ]
    },
    
    // Response relevance details
    responseRelevance: {
      overallScore: baseRelevanceScore,
      contextualRelevance: Math.round(baseRelevanceScore * 1.02),
      responseCoherence: Math.round(baseRelevanceScore * 0.98),
      topicConsistency: Math.round(baseRelevanceScore * 0.95),
      
      relevanceOverTime: dates.map((timestamp, index) => ({
        timestamp,
        contextualRelevance: Math.max(60, Math.min(98, Math.round(baseRelevanceScore * 1.02 + (Math.random() * 6 - 3)))),
        responseCoherence: Math.max(60, Math.min(98, Math.round(baseRelevanceScore * 0.98 + (Math.random() * 6 - 3)))),
        topicConsistency: Math.max(60, Math.min(98, Math.round(baseRelevanceScore * 0.95 + (Math.random() * 6 - 3))))
      })),
      
      relevanceByContextType: [
        { type: 'Sequential', score: Math.round(baseRelevanceScore * 1.05) },
        { type: 'Branching', score: Math.round(baseRelevanceScore * 0.9) },
        { type: 'Multi-topic', score: Math.round(baseRelevanceScore * 0.85) },
        { type: 'Reference-heavy', score: Math.round(baseRelevanceScore * 0.92) },
        { type: 'Time-sensitive', score: Math.round(baseRelevanceScore * 0.88) }
      ],
      
      relevanceByConversationLength: Array.from({ length: 10 }, (_, i) => ({
        messageCount: (i + 1) * 5,
        relevanceScore: Math.max(60, Math.round(baseRelevanceScore - i * 2.5))
      })),
      
      relevanceIssues: [
        {
          issue: 'Topic Drift',
          description: 'Responses gradually drift away from the original topic over long conversations.',
          severity: 'medium',
          frequency: '12% of long conversations',
          recommendation: 'Periodically reference the main topic or ask clarifying questions.'
        },
        {
          issue: 'Context Confusion',
          description: 'System occasionally confuses similar contexts when multiple topics are discussed.',
          severity: 'high',
          frequency: '8% of multi-topic conversations',
          recommendation: 'Clearly separate different topics and provide explicit context when switching.'
        },
        {
          issue: 'Reference Resolution',
          description: 'Pronouns and references are correctly resolved in most cases.',
          severity: 'low',
          frequency: 'Successful in 94% of cases',
          recommendation: 'Continue using clear references to maintain this performance.'
        }
      ],
      
      improvementStrategies: [
        {
          title: 'Topic Anchoring',
          description: 'Periodically reference the main topic to prevent drift in long conversations.',
          expectedImprovement: '+8% topic consistency'
        },
        {
          title: 'Context Refreshing',
          description: 'Summarize previous context when resuming conversations after breaks.',
          expectedImprovement: '+12% contextual relevance'
        },
        {
          title: 'Explicit Transitions',
          description: 'Use clear transition phrases when changing topics or reference points.',
          expectedImprovement: '+15% in multi-topic coherence'
        },
        {
          title: 'Specific References',
          description: 'Use specific nouns instead of pronouns for important concepts.',
          expectedImprovement: '+10% reference resolution accuracy'
        }
      ]
    }
  };
};

/**
 * Generate a range of dates based on the timeframe
 */
const generateDateRange = (timeframe: string): string[] => {
  const dates: string[] = [];
  const now = new Date();
  
  let days = 7; // default to week
  
  if (timeframe === 'day') {
    days = 1;
  } else if (timeframe === 'month') {
    days = 30;
  } else if (timeframe === 'all') {
    days = 90; // show up to 90 days for "all time"
  }
  
  // Generate dates in reverse order (most recent first)
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    
    // Format date based on timeframe
    let formattedDate = '';
    
    if (timeframe === 'day') {
      // For day view, use hours
      date.setHours(now.getHours() - i);
      formattedDate = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (timeframe === 'week') {
      // For week view, use day of week
      formattedDate = date.toLocaleDateString([], { weekday: 'short' });
    } else {
      // For month and all time, use date
      formattedDate = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    dates.push(formattedDate);
  }
  
  return dates;
};

/**
 * Clear analytics cache
 */
export const clearContextAnalyticsCache = () => {
  analyticsCache = {};
};

/**
 * Export analytics data to JSON
 */
export const exportContextAnalyticsData = async (userId: string) => {
  try {
    const data = await getContextAnalyticsData(userId);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `context-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export context analytics data:', error);
    throw error;
  }
};