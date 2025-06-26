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
  MessageSquare,
  Settings
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
  const chatContainerRef = useRef<HTMLDivElement>(null);

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
      // Stop any browser speech synthesis
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Auto-scroll to bottom with smooth behavior
  useEffect(() => {
    if (messagesEndRef.current && chatContainerRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
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
      
      // Stop any ongoing speech first
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }

      console.log(`Generating speech for text: "${text.substring(0, 50)}..."`);
      console.log(`Using avatar: ${currentAvatar}`);
      
      const audioBlob = await ElevenLabsService.generateSpeech(text, currentAvatar);
      
      if (audioBlob && audioBlob.size > 1000) {
        // This is a real audio file from ElevenLabs
        console.log('Playing ElevenLabs audio');
        const audioUrl = URL.createObjectURL(audioBlob);
        audioRef.current = new Audio(audioUrl);
        audioRef.current.volume = volume;
        
        audioRef.current.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setIsSpeaking(false);
          console.log('ElevenLabs audio playback ended');
        };
        
        audioRef.current.onerror = (e) => {
          console.error('Audio playback error:', e);
          URL.revokeObjectURL(audioUrl);
          setIsSpeaking(false);
          toast.error('Failed to play audio response');
        };
        
        await audioRef.current.play();
      } else {
        // Browser speech synthesis is handling the audio
        console.log('Using browser speech synthesis');
        
        // Listen for speech synthesis events
        if ('speechSynthesis' in window) {
          const handleSpeechEnd = () => {
            setIsSpeaking(false);
            window.speechSynthesis.removeEventListener('speechend', handleSpeechEnd);
          };
          
          const handleSpeechError = () => {
            setIsSpeaking(false);
            window.speechSynthesis.removeEventListener('speecherror', handleSpeechError);
          };
          
          // Check if speech synthesis is currently speaking
          const checkSpeaking = () => {
            if (!window.speechSynthesis.speaking) {
              setIsSpeaking(false);
            } else {
              // Check again in 100ms
              setTimeout(checkSpeaking, 100);
            }
          };
          
          // Start checking after a small delay
          setTimeout(checkSpeaking, 500);
        } else {
          // Fallback timeout estimation
          const estimatedDuration = Math.max(3000, text.length * 80); // ~80ms per character
          setTimeout(() => {
            setIsSpeaking(false);
          }, estimatedDuration);
        }
      }
      
    } catch (error) {
      console.error('Error generating speech:', error);
      setIsSpeaking(false);
      toast.error('Failed to generate speech. Please try again.');
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
        toast.success('Listening... Speak now!');
      } catch (error) {
        toast.error('Microphone access denied');
      }
    }
  };

  const toggleSpeaking = () => {
    if (isSpeaking) {
      // Stop ElevenLabs audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      // Stop browser speech synthesis
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      
      setIsSpeaking(false);
      toast.success('Speech stopped');
    }
  };

  const endSession = () => {
    // Clean up any ongoing audio
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    
    toast.success('Study session completed!');
    navigate('/analytics');
  };

  const switchMode = (newMode: 'text' | 'voice') => {
    // Stop any ongoing audio/recognition
    if (audioRef.current) {
      audioRef.current.pause();
      setIsSpeaking(false);
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    
    setMode(newMode);
    toast.success(`Switched to ${newMode} mode`);
  };

  if (!currentSubject || !currentAvatar || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <div className="flex-1 flex flex-col container mx-auto px-4 py-3 max-w-6xl">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Link 
              to="/subjects" 
              className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{currentSubject}</h1>
              <p className="text-sm text-gray-600">{difficultyLevel} • {currentAvatar.replace('-', ' ')}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-xs text-gray-500">
              Messages: {sessionStats.messagesCount} | XP: {sessionStats.xpEarned}
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<BarChart className="h-3 w-3" />}
              onClick={() => navigate('/analytics')}
            >
              Analytics
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={endSession}
            >
              End
            </Button>
          </div>
        </div>

        {/* Compact Mode Toggle */}
        <div className="mb-3">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => switchMode('text')}
                className={cn(
                  "flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  mode === 'text'
                    ? "bg-white text-primary-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Text Chat
              </button>
              <button
                onClick={() => switchMode('voice')}
                className={cn(
                  "flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  mode === 'voice'
                    ? "bg-white text-primary-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <Video className="h-3 w-3 mr-1" />
                Voice Chat
              </button>
            </div>
            
            {/* Voice Controls - Only show in voice mode */}
            {mode === 'voice' && (
              <div className="flex items-center space-x-3">
                {currentTranscript && (
                  <div className="text-xs text-blue-600 max-w-xs truncate bg-blue-50 px-2 py-1 rounded">
                    "{currentTranscript}"
                  </div>
                )}
                {isProcessing && (
                  <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">Processing...</div>
                )}
                <div className="flex items-center space-x-2">
                  <Button
                    variant={isListening ? "secondary" : "primary"}
                    size="sm"
                    leftIcon={isListening ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                    onClick={toggleListening}
                    disabled={isProcessing}
                  >
                    {isListening ? 'Stop' : 'Listen'}
                  </Button>
                  
                  {isSpeaking && (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<VolumeX className="h-3 w-3" />}
                      onClick={toggleSpeaking}
                    >
                      Stop Speaking
                    </Button>
                  )}
                  
                  {/* Volume Control */}
                  <div className="flex items-center space-x-1">
                    <Volume2 className="h-3 w-3 text-gray-500" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-16 h-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area - Expanded */}
        <div className="flex-1 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col min-h-0">
            {/* Messages - Scrollable Area */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
              style={{ maxHeight: 'calc(100vh - 280px)' }}
            >
              {messages.length === 0 ? (
                <div className="text-center py-8">
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
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.sender === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-lg px-4 py-3",
                          message.sender === 'user'
                            ? "bg-primary-600 text-white rounded-br-sm"
                            : "bg-gray-100 text-gray-800 rounded-bl-sm"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
                        <p className={cn(
                          "text-xs mt-2",
                          message.sender === 'user' ? "text-primary-100" : "text-gray-500"
                        )}>
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Live transcript */}
                  {mode === 'voice' && currentTranscript && (
                    <div className="flex justify-end">
                      <div className="max-w-[85%] rounded-lg px-4 py-3 bg-blue-50 text-blue-800 border border-blue-200">
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
                      <div className="bg-gray-100 rounded-lg px-4 py-3">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* AI speaking indicator */}
                  {isSpeaking && (
                    <div className="flex justify-start">
                      <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3">
                        <div className="flex items-center space-x-2 text-purple-700">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm font-medium">AI is speaking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Compact */}
            {mode === 'text' && (
              <div className="border-t p-3">
                <form onSubmit={handleTextSubmit} className="flex space-x-2">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Ask a question about your subject..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    disabled={isProcessing}
                  />
                  <Button
                    type="submit"
                    disabled={!textInput.trim() || isProcessing}
                    isLoading={isProcessing}
                    leftIcon={<Send className="h-4 w-4" />}
                    size="sm"
                  >
                    Send
                  </Button>
                </form>
              </div>
            )}
          </Card>
        </div>

        {/* Compact Status Bar */}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500 px-2">
          <div className="flex items-center space-x-4">
            <div className={cn(
              "flex items-center space-x-1",
              mode === 'voice' ? "text-blue-600" : "text-gray-500"
            )}>
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                mode === 'voice' ? "bg-blue-500" : "bg-gray-400"
              )}></div>
              <span>{mode === 'voice' ? 'Voice Mode' : 'Text Mode'}</span>
            </div>
            
            {isListening && (
              <div className="flex items-center space-x-1 text-green-600">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span>Listening...</span>
              </div>
            )}
            
            {isSpeaking && (
              <div className="flex items-center space-x-1 text-purple-600">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></div>
                <span>AI Speaking...</span>
              </div>
            )}
          </div>
          
          <div>
            Duration: {Math.floor((Date.now() - sessionStats.startTime.getTime()) / 60000)} min
          </div>
        </div>
      </div>
    </div>
  );
};