import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useStore } from '../store/store';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  VolumeX,
  Video,
  BarChart,
  MessageSquare
} from 'lucide-react';
import { cn } from '../styles/utils';
import toast from 'react-hot-toast';
import { GroqService } from '../services/groqService';
import { ElevenLabsService } from '../services/elevenlabsService';
import { supabase } from '../lib/supabase';

export const StudyPage: React.FC = () => {
  const { 
    currentSubject, 
    currentAvatar, 
    difficultyLevel,
    addMessage,
    messages,
    updateSessionStats,
    sessionStats
  } = useStore();
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Core state
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [volume, setVolume] = useState(0.8);
  
  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');
          
          setCurrentTranscript(transcript);
          
          if (event.results[event.results.length - 1].isFinal) {
            handleVoiceInput(transcript);
          }
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          if (event.error !== 'aborted') {
            toast.error('Speech recognition error. Please try again.');
          }
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
          setCurrentTranscript('');
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Session initialization
  useEffect(() => {
    if (!currentSubject || !currentAvatar || !user) {
      navigate('/subjects');
      return;
    }
    
    // Initialize session
    updateSessionStats({
      startTime: new Date(),
      duration: 0,
      messagesCount: 0,
      topicsDiscussed: [],
      xpEarned: 0
    });
  }, [currentSubject, currentAvatar, user, navigate, updateSessionStats]);

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isProcessing) return;

    await processMessage(textInput.trim());
    setTextInput('');
  };

  const handleVoiceInput = async (transcript: string) => {
    if (!transcript.trim() || isProcessing) return;
    await processMessage(transcript.trim());
  };

  const processMessage = async (message: string) => {
    setIsProcessing(true);
    
    try {
      // Add user message
      addMessage(message, 'user');
      
      // Update session stats
      updateSessionStats({
        ...sessionStats,
        messagesCount: sessionStats.messagesCount + 1,
        xpEarned: sessionStats.xpEarned + 10
      });

      // Generate AI response
      const aiResponse = await GroqService.generateResponse(
        message,
        currentSubject,
        currentAvatar,
        difficultyLevel,
        user!.id
      );

      // Add AI message
      addMessage(aiResponse, 'ai');

      // Generate speech for voice mode
      if (mode === 'voice') {
        await generateAndPlaySpeech(aiResponse);
      }

      // Save to database
      await saveConversation(message, aiResponse);

    } catch (error) {
      console.error('Error processing message:', error);
      toast.error('Failed to get response. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateAndPlaySpeech = async (text: string) => {
    try {
      setIsSpeaking(true);
      const audioBlob = await ElevenLabsService.generateSpeech(text, currentAvatar);
      
      if (audioBlob && audioBlob.size > 0) {
        const audioUrl = URL.createObjectURL(audioBlob);
        audioRef.current = new Audio(audioUrl);
        audioRef.current.volume = volume;
        
        audioRef.current.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setIsSpeaking(false);
        };
        
        audioRef.current.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          setIsSpeaking(false);
          toast.error('Failed to play audio response');
        };
        
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Error generating speech:', error);
      setIsSpeaking(false);
    }
  };

  const saveConversation = async (userMessage: string, aiResponse: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
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

  const toggleListening = async () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        toast.error('Microphone access denied');
      }
    }
  };

  const toggleSpeaking = () => {
    if (isSpeaking && audioRef.current) {
      audioRef.current.pause();
      setIsSpeaking(false);
    }
  };

  const endSession = () => {
    toast.success('Study session completed!');
    navigate('/analytics');
  };

  const switchMode = (newMode: 'text' | 'voice') => {
    // Stop any ongoing audio/recognition
    if (audioRef.current) {
      audioRef.current.pause();
      setIsSpeaking(false);
    }
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    
    setMode(newMode);
    toast.success(`Switched to ${newMode} mode`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
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
              <p className="text-gray-600">{difficultyLevel} • {currentAvatar.replace('-', ' ')}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<BarChart className="h-4 w-4" />}
              onClick={() => navigate('/analytics')}
            >
              Analytics
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

        {/* Mode Toggle */}
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => switchMode('text')}
                className={cn(
                  "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  mode === 'text'
                    ? "bg-white text-primary-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Text Chat
              </button>
              <button
                onClick={() => switchMode('voice')}
                className={cn(
                  "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  mode === 'voice'
                    ? "bg-white text-primary-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <Video className="h-4 w-4 mr-2" />
                Voice Chat
              </button>
            </div>

            {/* Session Stats */}
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Messages: {sessionStats.messagesCount}</span>
              <span>XP: {sessionStats.xpEarned}</span>
            </div>
          </div>
        </Card>

        {/* Chat Area */}
        <Card className="h-[500px] flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Start Learning {currentSubject}
                </h3>
                <p className="text-gray-600">
                  Ask any question about {currentSubject} to begin your session
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.sender === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-4 py-2",
                      message.sender === 'user'
                        ? "bg-primary-600 text-white rounded-br-sm"
                        : "bg-gray-100 text-gray-800 rounded-bl-sm"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    <p className={cn(
                      "text-xs mt-1",
                      message.sender === 'user' ? "text-primary-100" : "text-gray-500"
                    )}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            
            {/* Live transcript */}
            {mode === 'voice' && currentTranscript && (
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-lg px-4 py-2 bg-blue-50 text-blue-800 border border-blue-200">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs font-medium">Speaking...</span>
                  </div>
                  <p className="text-sm">{currentTranscript}</p>
                </div>
              </div>
            )}
            
            {/* Processing indicator */}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t p-4">
            {mode === 'text' ? (
              <form onSubmit={handleTextSubmit} className="flex space-x-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Ask a question about your subject..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={isProcessing}
                />
                <Button
                  type="submit"
                  disabled={!textInput.trim() || isProcessing}
                  isLoading={isProcessing}
                  leftIcon={<Send className="h-4 w-4" />}
                >
                  Send
                </Button>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant={isListening ? "secondary" : "primary"}
                    onClick={toggleListening}
                    disabled={isProcessing}
                    leftIcon={isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  >
                    {isListening ? 'Stop Listening' : 'Start Speaking'}
                  </Button>
                  
                  {isSpeaking && (
                    <Button
                      variant="outline"
                      onClick={toggleSpeaking}
                      leftIcon={<VolumeX className="h-4 w-4" />}
                    >
                      Stop Speaking
                    </Button>
                  )}
                </div>

                {/* Volume Control */}
                <div className="flex items-center space-x-2">
                  <Volume2 className="h-4 w-4 text-gray-500" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-20"
                  />
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Status Indicators */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <div className={cn(
              "flex items-center space-x-1",
              mode === 'voice' ? "text-blue-600" : "text-gray-500"
            )}>
              <div className={cn(
                "w-2 h-2 rounded-full",
                mode === 'voice' ? "bg-blue-500" : "bg-gray-400"
              )}></div>
              <span>{mode === 'voice' ? 'Voice Mode' : 'Text Mode'}</span>
            </div>
            
            {isListening && (
              <div className="flex items-center space-x-1 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Listening...</span>
              </div>
            )}
            
            {isSpeaking && (
              <div className="flex items-center space-x-1 text-purple-600">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span>AI Speaking...</span>
              </div>
            )}
          </div>
          
          <div className="text-xs">
            Duration: {Math.floor((Date.now() - sessionStats.startTime.getTime()) / 60000)} min
          </div>
        </div>
      </div>
    </div>
  );
};