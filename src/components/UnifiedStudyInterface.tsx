import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/store';
import { useAuth } from '../contexts/AuthContext';
import { useConversation } from '../hooks/useConversation';
import { useVoiceChat } from '../hooks/useVoiceChat';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, 
  Mic, 
  MicOff, 
  Send, 
  Settings, 
  X, 
  MessageSquare,
  Video,
  BarChart,
  Upload,
  Download,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  Zap,
  BookOpen
} from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';
import { cn } from '../styles/utils';
import { StudyModeToggle } from './StudyModeToggle';
import { StudyModePrompt } from './StudyModePrompt';
import { StudySessionEndModal } from './StudySessionEndModal';
import { AudioVisualizer } from './AudioVisualizer';
import toast from 'react-hot-toast';

export const UnifiedStudyInterface: React.FC = () => {
  const { 
    currentSubject, 
    currentAvatar, 
    difficultyLevel,
    addMessage,
    messages,
    updateSessionStats,
    sessionStats,
    isStudyMode,
    learningMode,
    setLearningMode,
    isSpeaking
  } = useStore();
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sendMessage, isProcessing } = useConversation();
  
  // Core state
  const [textInput, setTextInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [showStudyModePrompt, setShowStudyModePrompt] = useState(false);
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isImageUploadMode, setIsImageUploadMode] = useState(false);
  
  // Voice chat state and hooks
  const { 
    isActive,
    isPaused,
    currentTranscript,
    startVoiceChat,
    stopVoiceChat,
    pauseVoiceChat,
    resumeVoiceChat,
    forceSubmitTranscript,
    visualizationData
  } = useVoiceChat();
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom with smooth behavior
  useEffect(() => {
    if (messagesEndRef.current && chatContainerRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [messages, currentTranscript]);

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
    
    // Load conversation history
    loadConversationHistory();
  }, [currentSubject, currentAvatar, user, navigate, updateSessionStats]);

  // Show study mode prompt when study mode is activated
  useEffect(() => {
    if (isStudyMode) {
      setShowStudyModePrompt(true);
    }
  }, [isStudyMode]);

  const loadConversationHistory = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setConversationHistory(data || []);
    } catch (error) {
      console.error('Error loading conversation history:', error);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isProcessing) return;

    await sendMessage(textInput.trim(), learningMode === 'videocall');
    setTextInput('');
  };

  const toggleVoiceMode = () => {
    if (isActive) {
      stopVoiceChat();
    } else {
      startVoiceChat();
    }
  };

  const togglePauseResume = () => {
    if (isPaused) {
      resumeVoiceChat();
    } else {
      pauseVoiceChat();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    // Apply volume to all audio elements
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.volume = newVolume;
    });
  };

  const switchLearningMode = (mode: 'conversational' | 'videocall') => {
    setLearningMode(mode);
    
    if (mode === 'videocall') {
      startVoiceChat();
    } else {
      stopVoiceChat();
    }
    
    toast.success(`Switched to ${mode === 'conversational' ? 'text' : 'voice'} mode`);
  };

  const endSession = () => {
    setShowEndSessionModal(true);
  };

  const handleImageUpload = () => {
    setIsImageUploadMode(!isImageUploadMode);
    if (isImageUploadMode && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }
    
    // Create a message about the image
    const imageMessage = `I'm uploading an image about ${currentSubject}. Please analyze it and provide feedback.`;
    
    // In a real implementation, you would upload the image to a server
    // For now, we'll just simulate the image analysis
    sendMessage(imageMessage, false);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    setIsImageUploadMode(false);
    toast.success('Image uploaded for analysis');
  };

  const handleDownloadTranscript = () => {
    if (messages.length === 0) {
      toast.error('No conversation to download');
      return;
    }
    
    // Create transcript text
    const transcript = messages.map(msg => 
      `${msg.sender === 'user' ? 'You' : 'AI'}: ${msg.text}`
    ).join('\n\n');
    
    // Create download link
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSubject}-transcript-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Transcript downloaded successfully');
  };

  if (!currentSubject || !currentAvatar || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Study Mode Prompt */}
      {showStudyModePrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <StudyModePrompt onClose={() => setShowStudyModePrompt(false)} />
        </div>
      )}

      {/* End Session Modal */}
      {showEndSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <StudySessionEndModal 
            onClose={() => setShowEndSessionModal(false)} 
            className="w-full max-w-md"
          />
        </div>
      )}
      
      <div className="flex-1 flex flex-col max-w-6xl mx-auto px-4 py-4 w-full">
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-4">
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
            <div className="text-xs text-gray-500 hidden sm:block">
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
        
        {/* Main Interface */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            {/* Mode Selector */}
            <div className="flex bg-white rounded-lg p-1 shadow-sm">
              <button
                onClick={() => switchLearningMode('conversational')}
                className={cn(
                  "flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  learningMode === 'conversational'
                    ? "bg-primary-100 text-primary-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Text
              </button>
              <button
                onClick={() => switchLearningMode('videocall')}
                className={cn(
                  "flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  learningMode === 'videocall'
                    ? "bg-primary-100 text-primary-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                <Video className="h-3 w-3 mr-1" />
                Voice
              </button>
            </div>
            
            {/* Right Controls */}
            <div className="flex items-center space-x-2">
              <StudyModeToggle />
              
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Settings className="h-3 w-3" />}
                onClick={() => setShowSettings(!showSettings)}
              >
                Settings
              </Button>
            </div>
          </div>
          
          {/* Settings Panel */}
          {showSettings && (
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-4">
                  {/* Volume Control */}
                  <div className="flex items-center space-x-2">
                    <VolumeX className="h-4 w-4 text-gray-500" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                    <Volume2 className="h-4 w-4 text-gray-500" />
                  </div>
                  
                  {/* Image Upload */}
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<ImageIcon className="h-3 w-3" />}
                    onClick={handleImageUpload}
                    className={isImageUploadMode ? "bg-primary-50 border-primary-200" : ""}
                  >
                    Upload Image
                  </Button>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  
                  {/* Download Transcript */}
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Download className="h-3 w-3" />}
                    onClick={handleDownloadTranscript}
                  >
                    Download
                  </Button>
                </div>
                
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
            </div>
          )}
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Chat Area */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Messages */}
              <div 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                      {isStudyMode ? (
                        <BookOpen className="h-8 w-8 text-primary-600" />
                      ) : (
                        <MessageSquare className="h-8 w-8 text-primary-600" />
                      )}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {isStudyMode ? 'Study Mode Active' : 'Start Learning'}
                    </h3>
                    <p className="text-gray-600 max-w-md">
                      {isStudyMode 
                        ? 'Ask specific questions about your subject material for deeper educational insights.'
                        : `Ask any question about ${currentSubject} to begin your learning session.`}
                    </p>
                    
                    {learningMode === 'videocall' && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg max-w-md">
                        <p className="text-blue-700 text-sm font-medium">Voice Mode Active</p>
                        <p className="text-blue-600 text-xs mt-1">
                          Click the microphone button below to start speaking
                        </p>
                      </div>
                    )}
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
                            "max-w-[85%] rounded-lg px-4 py-2 relative",
                            message.sender === 'user'
                              ? "bg-primary-600 text-white rounded-br-sm"
                              : "bg-gray-100 text-gray-800 rounded-bl-sm"
                          )}
                        >
                          <div className="text-sm whitespace-pre-wrap">{message.text}</div>
                          <div className={cn(
                            "text-xs mt-1 flex items-center justify-between",
                            message.sender === 'user' ? "text-primary-100" : "text-gray-500"
                          )}>
                            <span>{message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Live transcript */}
                    {currentTranscript && (
                      <div className="flex justify-end">
                        <div className="max-w-[85%] rounded-lg px-4 py-2 bg-blue-50 text-blue-800 border border-blue-100">
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="flex space-x-1">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <span className="text-xs font-medium">Listening...</span>
                          </div>
                          <div className="text-sm">{currentTranscript}</div>
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
                    
                    {/* AI speaking indicator */}
                    {isSpeaking && (
                      <div className="flex justify-start">
                        <div className="bg-green-100 text-green-800 rounded-lg px-4 py-2 flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm">AI Speaking...</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                <div ref={messagesEndRef} />
              </div>
              
              {/* Input Area */}
              <div className="border-t border-gray-200 p-3 bg-white">
                <form onSubmit={handleTextSubmit} className="flex space-x-2">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={isStudyMode 
                      ? "Ask a specific question about your subject..." 
                      : "Type your message..."}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    disabled={isProcessing}
                  />
                  
                  {learningMode === 'videocall' && (
                    <Button
                      type="button"
                      variant={isActive ? "secondary" : "primary"}
                      onClick={toggleVoiceMode}
                      disabled={isProcessing}
                      className="px-3"
                    >
                      {isActive ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </Button>
                  )}
                  
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={(!textInput.trim() && learningMode !== 'videocall') || isProcessing}
                    isLoading={isProcessing}
                    className="px-3"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </form>
                
                {/* Voice Controls */}
                {learningMode === 'videocall' && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex flex-col space-y-3">
                      {/* Audio Visualization */}
                      <AudioVisualizer 
                        audioData={visualizationData || []}
                        isActive={isActive}
                        height={40}
                      />
                      
                      {/* Voice Control Buttons */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant={isPaused ? "primary" : "outline"}
                            size="sm"
                            onClick={togglePauseResume}
                            disabled={!isActive}
                          >
                            {isPaused ? "Resume" : "Pause"}
                          </Button>
                          
                          {currentTranscript && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={forceSubmitTranscript}
                            >
                              Submit Now
                            </Button>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          {isActive ? (
                            <span className="text-green-600 font-medium">Voice Active</span>
                          ) : isPaused ? (
                            <span className="text-amber-600 font-medium">Paused</span>
                          ) : (
                            <span>Click mic to start</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* History Sidebar */}
            {showHistory && (
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-gray-200 bg-gray-50 overflow-y-auto">
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Previous Conversations</h3>
                  {conversationHistory.length > 0 ? (
                    <div className="space-y-3">
                      {conversationHistory.map((conv, index) => (
                        <div key={conv.id || index} className="p-3 bg-white rounded-lg shadow-sm">
                          <div className="text-xs text-gray-500 mb-1">
                            {new Date(conv.timestamp).toLocaleDateString()}
                          </div>
                          <div className="text-sm">
                            <strong>You:</strong> {conv.user_message?.substring(0, 60)}
                            {conv.user_message?.length > 60 && '...'}
                          </div>
                          <div className="text-sm mt-1">
                            <strong>AI:</strong> {conv.ai_response?.substring(0, 60)}
                            {conv.ai_response?.length > 60 && '...'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No previous conversations found.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
        
        {/* Status Bar */}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500 px-2">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              <span>{learningMode === 'videocall' ? 'Voice Mode' : 'Text Mode'}</span>
            </div>
            
            {isStudyMode && (
              <div className="flex items-center space-x-1 text-amber-600">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                <span>Study Mode</span>
              </div>
            )}
            
            {isActive && (
              <div className="flex items-center space-x-1 text-blue-600">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Listening</span>
              </div>
            )}
            
            {isSpeaking && (
              <div className="flex items-center space-x-1 text-purple-600">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></div>
                <span>AI Speaking</span>
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

export default UnifiedStudyInterface;