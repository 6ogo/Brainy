import { create } from 'zustand';
import { AppState, DifficultyLevel, Message, Subject, VoiceMode, AvatarPersonality, AvatarBackground, AvatarEmotion } from '../types';

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
  
  toggleListening: () => 
    set((state) => ({ isListening: !state.isListening })),
  
  addMessage: (text: string, sender: 'user' | 'ai', isBreakthrough = false) => 
    set((state) => ({
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
        xpEarned: state.sessionStats.xpEarned + (isBreakthrough ? 50 : 10),
      },
    })),
  
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
    set((state) => ({
      socialStats: {
        ...state.socialStats,
        ...stats,
      },
    })),

  completeChallenge: (challengeId: string) =>
    set((state) => {
      const challenge = state.socialStats.activeChallenges.find(c => c.id === challengeId);
      if (!challenge || challenge.isCompleted) return state;

      return {
        socialStats: {
          ...state.socialStats,
          totalXP: state.socialStats.totalXP + challenge.xpReward,
          level: Math.floor((state.socialStats.totalXP + challenge.xpReward) / 1000) + 1,
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
          },
        };
      }

      return state;
    }),
}));