import { create } from 'zustand';

// Core types for the application

export type Subject = 'Math' | 'Science' | 'English' | 'History' | 'Languages' | 'Test Prep' | 'All';

export type DifficultyLevel = 'Elementary' | 'High School' | 'College' | 'Advanced';

export type VoiceMode = 'push-to-talk' | 'continuous' | 'muted';

export type AvatarPersonality = 
  | 'encouraging-emma'
  | 'challenge-charlie'
  | 'fun-freddy'
  | 'professor-patricia'
  | 'buddy-ben';

export type AvatarBackground = 
  | 'classroom'
  | 'library'
  | 'home-office'
  | 'futuristic';

export type AvatarEmotion =
  | 'neutral'
  | 'happy'
  | 'thinking'
  | 'excited'
  | 'concerned';

export type LearningMode = 'conversational' | 'videocall';

export interface Avatar {
  id: AvatarPersonality;
  name: string;
  description: string;
  imageUrl: string;
  style: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isBreakthrough?: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
}

export interface StudyStreak {
  current: number;
  longest: number;
  lastStudyDate: Date;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  subject: Subject;
  difficulty: DifficultyLevel;
  xpReward: number;
  deadline: Date;
  isCompleted: boolean;
}

export interface SessionStats {
  startTime: Date;
  duration: number;
  messagesCount: number;
  topicsDiscussed: string[];
  xpEarned: number;
}

export interface SocialStats {
  streak: StudyStreak;
  totalXP: number;
  achievements: Achievement[];
  activeChallenges: Challenge[];
  level: number;
  learningVelocity: number;
  engagementScore: number;
  consistencyRating: string;
  progressTrend: string;
  timeToNextLevel: number;
  levelProgress: number;
}

export interface LearningAnalytics {
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading/writing';
  peakStudyTime: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
  retentionRate: number;
  topicsAnalysis: {
    mastered: string[];
    inProgress: string[];
    struggling: string[];
    recommended: string[];
  };
  subjectDistribution: Record<Subject, number>;
  weeklyActivity: number[];
  averageSessionLength: number;
  totalStudyTime: number;
  consistencyRating: 'Building' | 'Good' | 'Excellent';
}

export interface AppState {
  messages: Message[];
  currentSubject: Subject;
  difficultyLevel: DifficultyLevel;
  voiceMode: VoiceMode;
  isListening: boolean;
  sessionStats: SessionStats;
  isSpeaking: boolean;
  currentAvatar: AvatarPersonality;
  currentBackground: AvatarBackground;
  avatarEmotion: AvatarEmotion;
  isVideoEnabled: boolean;
  isRecording: boolean;
  socialStats: SocialStats;
  learningMode: LearningMode;
  isStudyMode: boolean;
  learningAnalytics: LearningAnalytics | null;
  
  // Actions
  setCurrentSubject: (subject: Subject) => void;
  setDifficultyLevel: (level: DifficultyLevel) => void;
  setVoiceMode: (mode: VoiceMode) => void;
  toggleListening: (value?: boolean) => void;
  addMessage: (text: string, sender: 'user' | 'ai', isBreakthrough?: boolean) => void;
  clearMessages: () => void;
  updateSessionStats: (stats: Partial<SessionStats>) => void;
  setIsSpeaking: (isSpeaking: boolean) => void;
  setCurrentAvatar: (avatar: AvatarPersonality) => void;
  setCurrentBackground: (background: AvatarBackground) => void;
  setAvatarEmotion: (emotion: AvatarEmotion) => void;
  toggleVideo: () => void;
  toggleRecording: () => void;
  updateSocialStats: (stats: Partial<SocialStats>) => void;
  completeChallenge: (challengeId: string) => void;
  unlockAchievement: (achievementId: string) => void;
  updateStreak: () => void;
  setLearningMode: (mode: LearningMode) => void;
  setStudyMode: (isEnabled: boolean) => void;
  updateLearningAnalytics: (analytics: Partial<LearningAnalytics>) => void;
}