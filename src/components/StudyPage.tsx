import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { VideoArea } from '../components/VideoArea';
import { ChatTranscript } from '../components/ChatTranscript';
import { ProgressSidebar } from '../components/ProgressSidebar';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useStore } from '../store/store';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, MessageSquare, Mic, MicOff, Settings2, X } from 'lucide-react';
import { cn } from '../styles/utils';
import toast from 'react-hot-toast';
import { VoiceConversationService } from '../services/voiceConversationService';
import { GroqService } from '../services/groqService';
import { supabase } from '../lib/supabase';

export const StudyPage: React.FC = () => {
  const { 
    currentSubject, 
    currentAvatar, 
    learningMode, 
    updateSessionStats, 
    difficultyLevel,
    setLearningMode,
    addMessage
  } = useStore();
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isProcessingText, setIsProcessingText] = useState(false);
  
  const voiceServiceRef = useRef<VoiceConversationService | null>(null);
  const userId = user?.id;

  useEffect(() => {
    if (!currentSubject || !currentAvatar) {
      navigate('/subjects');
      return;
    }
    
    if (!sessionStarted) {
      updateSessionStats({
        startTime: new Date(),
        duration: 0,
        messagesCount: 0,
        topicsDiscussed: [],
        xpEarned: 0
      });
      setSessionStarted(true);
      loadConversationHistory();
    }
    
    window.scrollTo(0, 0);
  }, [currentSubject, currentAvatar, navigate, sessionStarted, updateSessionStats]);

  // Initialize voice service when switching to voice mode
  useEffect(() => {
    if (learningMode === 'videocall' && userId && !voiceServiceRef.current) {
      initializeVoiceService();
    } else if (learningMode === 'conversational' && voiceServiceRef.current) {
      cleanupVoiceService();
    }
    
    return () => {
      cleanupVoiceService();
    };
  }, [learningMode, userId]);

  const loadConversationHistory = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setConversationHistory(data || []);
    } catch (error) {
      console.error('Error loading conversation history:', error);
    }
  };

  const initializeVoiceService = () => {
    if (!userId) return;
    
    try {
      voiceServiceRef.current = new VoiceConversationService({
        userId,
        subject: currentSubject,
        avatarPersonality: currentAvatar,
        difficultyLevel,
        onResponse: (text) => {
          // Add AI response to store
          addMessage(text, 'ai');
          
          // Add to local history
          setConversationHistory(prev => [{
            id: Date.now(),
            user_message: currentTranscript,
            ai_response: text,
            timestamp: new Date().toISOString()
          }, ...prev]);
        },
        onAudioStart: () => {
          setIsProcessingVoice(false);
        },
        onAudioEnd: () => {
          // Ready for next input
        },
        onError: (error) => {
          console.error('Voice conversation error:', error);
          toast.error(error);
          setIsProcessingVoice(false);
        },
        onTranscript: (text, isFinal) => {
          setCurrentTranscript(text);
          if (isFinal && text.trim()) {
            setIsProcessingVoice(true);
            // Add user message to store
            addMessage(text, 'user');
          }
        }
      });
      
      toast.success('Voice mode initialized! Click the microphone to start talking.');
    } catch (error) {
      console.error('Failed to initialize voice service:', error);
      toast.error('Failed to initialize voice mode. Please check your microphone permissions.');
    }
  };

  const cleanupVoiceService = () => {
    if (voiceServiceRef.current) {
      voiceServiceRef.current.stopListening();
      voiceServiceRef.current = null;
    }
    setIsVoiceActive(false);
    setCurrentTranscript('');
    setIsProcessingVoice(false);
  };

  const toggleVoiceMode = async () => {
    if (!voiceServiceRef.current) return;
    
    if (isVoiceActive) {
      voiceServiceRef.current.pauseConversation();
      setIsVoiceActive(false);
      toast.success('Voice mode paused');
    } else {
      try {
        await voiceServiceRef.current.startListening();
        setIsVoiceActive(true);
        toast.success('Voice mode active - speak now!');
      } catch (error) {
        console.error('Failed to start voice mode:', error);
        toast.error('Failed to start voice mode. Please check your microphone.');
      }
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isProcessingText || !userId) return;
    
    setIsProcessingText(true);
    const userMessage = textInput.trim();
    setTextInput('');
    
    try {
      // Add user message to store immediately
      addMessage(userMessage, 'user');
      
      // Get AI response
      const aiResponse = await GroqService.generateResponse(
        userMessage,
        currentSubject,
        currentAvatar,
        difficultyLevel,
        userId
      );
      
      // Add AI response to store
      addMessage(aiResponse, 'ai');
      
      // Save to database
      await saveConversation(userMessage, aiResponse);
      
    } catch (error) {
      console.error('Error processing text message:', error);
      toast.error('Failed to get response. Please try again.');
    } finally {
      setIsProcessingText(false);
    }
  };

  const saveConversation = async (userMessage: string, aiResponse: string) => {
    if (!userId) return;
    
    try {
      const { error } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          user_message: userMessage,
          ai_response: aiResponse,
          duration: 0,
          timestamp: new Date().toISOString()
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  const switchLearningMode = (mode: 'conversational' | 'videocall') => {
    setLearningMode(mode);
    toast.success(`Switched to ${mode === 'conversational' ? 'text chat' : 'voice chat'} mode`);
  };

  const endSession = () => {
    cleanupVoiceService();
    toast.success('Study session ended successfully!');
    navigate('/analytics');
  };

  if (!currentSubject || !currentAvatar || !userId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <div className="flex-1 container mx-auto px-4 py-6">
        {/* Simple Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link 
              to="/subjects" 
              className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{currentSubject}</h1>
              <p className="text-gray-600">{difficultyLevel} Level</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Settings2 className="h-4 w-4" />}
              onClick={() => setShowSettings(!showSettings)}
            >
              Settings
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={endSession}
            >
              End Session
            </Button>
          </div>
        </div>

        {/* Mode Selection - Simplified */}
        <div className="mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => switchLearningMode('conversational')}
                  className={cn(
                    "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    learningMode === 'conversational'
                      ? "bg-white text-primary-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Text Chat
                </button>
                <button
                  onClick={() => switchLearningMode('videocall')}
                  className={cn(
                    "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    learningMode === 'videocall'
                      ? "bg-white text-primary-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Voice Chat
                </button>
              </div>
              
              {/* Voice Control - Only show in voice mode */}
              {learningMode === 'videocall' && (
                <div className="flex items-center space-x-3">
                  {currentTranscript && (
                    <div className="text-sm text-gray-600 max-w-xs truncate">
                      "{currentTranscript}"
                    </div>
                  )}
                  {isProcessingVoice && (
                    <div className="text-sm text-amber-600">Processing...</div>
                  )}
                  <Button
                    variant={isVoiceActive ? "secondary" : "primary"}
                    size="sm"
                    leftIcon={isVoiceActive ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    onClick={toggleVoiceMode}
                    disabled={!voiceServiceRef.current}
                  >
                    {isVoiceActive ? 'Stop Listening' : 'Start Listening'}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Settings Panel - Simplified */}
        {showSettings && (
          <div className="mb-6">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Difficulty: {difficultyLevel}
                </span>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                  >
                    {showHistory ? 'Hide' : 'Show'} History
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<X className="h-4 w-4" />}
                    onClick={() => setShowSettings(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Video Area (only for voice mode) */}
            {learningMode === 'videocall' && (
              <Card className="overflow-hidden">
                <VideoArea />
              </Card>
            )}
            
            {/* Chat Area */}
            <Card className={`${learningMode === 'conversational' ? 'h-[500px]' : 'h-[300px]'} flex flex-col`}>
              <div className="flex-1 overflow-hidden">
                <ChatTranscript />
              </div>
              
              {/* Text Input - Only show in text mode */}
              {learningMode === 'conversational' && (
                <div className="border-t p-4">
                  <form onSubmit={handleTextSubmit} className="flex space-x-2">
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Type your question here..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      disabled={isProcessingText}
                    />
                    <Button
                      type="submit"
                      disabled={!textInput.trim() || isProcessingText}
                      isLoading={isProcessingText}
                    >
                      Send
                    </Button>
                  </form>
                </div>
              )}
            </Card>

            {/* Conversation History */}
            {showHistory && (
              <Card className="p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Previous Conversations</h3>
                  {conversationHistory.length > 0 ? (
                    <div className="space-y-3">
                      {conversationHistory.map((conv, index) => (
                        <div key={conv.id || index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">
                            {new Date(conv.timestamp).toLocaleDateString()}
                          </div>
                          <div className="text-sm">
                            <strong>You:</strong> {conv.user_message?.substring(0, 100)}
                            {conv.user_message?.length > 100 && '...'}
                          </div>
                          <div className="text-sm mt-1">
                            <strong>AI:</strong> {conv.ai_response?.substring(0, 100)}
                            {conv.ai_response?.length > 100 && '...'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No previous conversations found.</p>
                  )}
                </div>
              </Card>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <ProgressSidebar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyPage;