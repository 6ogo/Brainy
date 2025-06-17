import { create } from 'zustand';
import { AppState, DifficultyLevel, Subject, VoiceMode, AvatarPersonality, AvatarBackground, AvatarEmotion, LearningMode } from '../types';

export const useStore = create<AppState>((set) => ({
  messages: [],
  currentSubject: 'Math',
  difficultyLevel: 'High School',
  voiceMode: 'push-to-talk',
  isListening: false,
  isSpeaking: false,
  currentAvatar: 'encouraging-emma',
  currentBackground: 'classroom',
  avatarEmotion: 'neutral',
  isVideoEnabled: true,
  isRecording: false,
  learningMode: 'conversational',
  isStudyMode: false,
  socialStats: {
    streak: {
      current: 1,
      longest: 1,
      lastStudyDate: new Date(),
    },
    totalXP: 0,
    achievements: [],
    activeChallenges: [
      {
        id: 'challenge-1',
        title: 'Math Master',
        description: 'Complete 5 calculus problems',
        subject: 'Math',
        difficulty: 'High School',
        xpReward: 100,
        deadline: new Date(Date.now() + 86400000),
        isCompleted: false,
      }
    ],
    level: 1,
    learningVelocity: 0,
    engagementScore: 0,
    consistencyRating: 'Building',
    progressTrend: 'Steady',
    timeToNextLevel: 0,
    levelProgress: 0,
  },
  sessionStats: {
    startTime: new Date(),
    duration: 0,
    messagesCount: 0,
    topicsDiscussed: [],
    xpEarned: 0,
  },

  setCurrentSubject: (subject: Subject) => 
    set({ currentSubject: subject }),
  
  setDifficultyLevel: (level: DifficultyLevel) => 
    set({ difficultyLevel: level }),
  
  setVoiceMode: (mode: VoiceMode) => 
    set({ voiceMode: mode }),
  
  toggleListening: (value?: boolean) => 
    set((state) => ({ isListening: value !== undefined ? value : !state.isListening })),
  
  addMessage: (text: string, sender: 'user' | 'ai', isBreakthrough = false) => 
    set((state) => {
      // Calculate XP based on message type and content
      const baseXP = sender === 'user' ? 5 : 10;
      const breakthroughBonus = isBreakthrough ? 50 : 0;
      const lengthBonus = Math.floor(text.length / 500) * 5; // 5 XP per 500 chars
      const totalXP = baseXP + breakthroughBonus + lengthBonus;
      
      // Calculate new level based on total XP
      const newTotalXP = state.socialStats.totalXP + totalXP;
      const newLevel = Math.floor(newTotalXP / 1000) + 1;
      
      return {
        messages: [
          ...state.messages,
          {
            id: Date.now().toString(),
            text,
            sender,
            timestamp: new Date(),
            isBreakthrough,
          },
        ],
        sessionStats: {
          ...state.sessionStats,
          messagesCount: state.sessionStats.messagesCount + 1,
          xpEarned: state.sessionStats.xpEarned + totalXP,
        },
        socialStats: {
          ...state.socialStats,
          totalXP: newTotalXP,
          level: newLevel,
          // Update learning velocity (XP per hour)
          learningVelocity: state.sessionStats.duration > 0 
            ? Math.round((state.sessionStats.xpEarned / (state.sessionStats.duration / 3600)))
            : state.socialStats.learningVelocity,
          // Update level progress percentage
          levelProgress: ((newTotalXP % 1000) / 1000) * 100,
        },
      };
    }),
  
  clearMessages: () => 
    set({ messages: [] }),
  
  updateSessionStats: (stats) => 
    set((state) => ({
      sessionStats: {
        ...state.sessionStats,
        ...stats,
      },
    })),
  
  setIsSpeaking: (isSpeaking: boolean) => 
    set({ isSpeaking }),

  setCurrentAvatar: (avatar: AvatarPersonality) =>
    set({ currentAvatar: avatar }),

  setCurrentBackground: (background: AvatarBackground) =>
    set({ currentBackground: background }),

  setAvatarEmotion: (emotion: AvatarEmotion) =>
    set({ avatarEmotion: emotion }),

  toggleVideo: () =>
    set((state) => ({ isVideoEnabled: !state.isVideoEnabled })),

  toggleRecording: () =>
    set((state) => ({ isRecording: !state.isRecording })),

  updateSocialStats: (stats) =>
    set((state) => {
      // Calculate new level if totalXP is being updated
      let newLevel = state.socialStats.level;
      let levelProgress = state.socialStats.levelProgress;
      
      if ('totalXP' in stats) {
        newLevel = Math.floor((stats.totalXP as number) / 1000) + 1;
        levelProgress = (((stats.totalXP as number) % 1000) / 1000) * 100;
      }
      
      return {
        socialStats: {
          ...state.socialStats,
          ...stats,
          level: newLevel,
          levelProgress: levelProgress,
        },
      };
    }),

  completeChallenge: (challengeId: string) =>
    set((state) => {
      const challenge = state.socialStats.activeChallenges.find(c => c.id === challengeId);
      if (!challenge || challenge.isCompleted) return state;

      const newXP = state.socialStats.totalXP + challenge.xpReward;
      const newLevel = Math.floor(newXP / 1000) + 1;
      const levelProgress = ((newXP % 1000) / 1000) * 100;

      return {
        socialStats: {
          ...state.socialStats,
          totalXP: newXP,
          level: newLevel,
          levelProgress: levelProgress,
          activeChallenges: state.socialStats.activeChallenges.map(c =>
            c.id === challengeId ? { ...c, isCompleted: true } : c
          ),
        },
      };
    }),

  unlockAchievement: (achievementId: string) =>
    set((state) => {
      if (state.socialStats.achievements.some(a => a.id === achievementId)) return state;

      return {
        socialStats: {
          ...state.socialStats,
          achievements: [
            ...state.socialStats.achievements,
            {
              id: achievementId,
              title: 'New Achievement',
              description: 'You unlocked a new achievement!',
              icon: '🏆',
              unlockedAt: new Date(),
            },
          ],
        },
      };
    }),

  updateStreak: () =>
    set((state) => {
      const today = new Date();
      const lastStudyDate = new Date(state.socialStats.streak.lastStudyDate);
      const daysSinceLastStudy = Math.floor((today.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceLastStudy === 1) {
        const newCurrent = state.socialStats.streak.current + 1;
        return {
          socialStats: {
            ...state.socialStats,
            streak: {
              current: newCurrent,
              longest: Math.max(newCurrent, state.socialStats.streak.longest),
              lastStudyDate: today,
            },
            consistencyRating: newCurrent >= 7 ? 'Excellent' : newCurrent >= 3 ? 'Good' : 'Building',
          },
        };
      } else if (daysSinceLastStudy > 1) {
        return {
          socialStats: {
            ...state.socialStats,
            streak: {
              current: 1,
              longest: state.socialStats.streak.longest,
              lastStudyDate: today,
            },
            consistencyRating: 'Building',
          },
        };
      }

      return state;
    }),

  setLearningMode: (mode: LearningMode) =>
    set({ learningMode: mode }),
    
  setStudyMode: (isEnabled: boolean) =>
    set({ isStudyMode: isEnabled }),
}));