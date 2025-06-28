import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/store';
import { useAuth } from '../contexts/AuthContext';
import { useConversation } from '../hooks/useConversation';
import { useVoiceChat } from '../hooks/useVoiceChat';
import { 
  ArrowLeft, 
  Mic, 
  MicOff, 
  Send, 
  Settings, 
  X, 
  MessageSquare,
  BarChart,
  Download,
  Shield,
  Volume2,
  VolumeX,
  Sliders
} from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';
import { cn } from '../styles/utils';
import { StudyModeToggle } from './StudyModeToggle';
import { StudyModePrompt } from './StudyModePrompt';
import { AudioVisualizer } from './AudioVisualizer';
import { DifficultyLevelSelector } from './DifficultyLevelSelector';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

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
    isSpeaking,
    voiceMode,
    setVoiceMode
  } = useStore();
  
  const { user } = useAuth();
  const { sendMessage, isProcessing } = useConversation();
  
  // Core state
  const [textInput, setTextInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [feedbackPreventionEnabled, setFeedbackPreventionEnabled] = useState(true);
  const [showDifficultySelector, setShowDifficultySelector] = useState(false);
  
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
    visualizationData,
    toggleFeedbackPrevention
  } = useVoiceChat();
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

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
  }, [currentSubject, currentAvatar, user, updateSessionStats]);

  // Show study mode prompt when study mode is activated
  useEffect(() => {
    if (isStudyMode) {
      setShowStudyModePrompt(true);
    }
  }, [isStudyMode]);

  const [showStudyModePrompt, setShowStudyModePrompt] = useState(false);

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
      setVoiceMode('continuous');
      startVoiceChat();
    } else {
      stopVoiceChat();
    }
    
    toast.success(`Switched to ${mode === 'conversational' ? 'text' : 'voice'} mode`);
  };

  const endSession = () => {
    setShowEndSessionModal(true);
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

  const handleOpenDifficultySelector = () => {
    setShowDifficultySelector(true);
  };

  // Function to render markdown with sanitization
  const renderMarkdown = (text: string) => {
    try {
      // Parse markdown to HTML
      const rawHtml = marked.parse(text);
      
      // Sanitize HTML to prevent XSS attacks
      const sanitizedHtml = DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'hr', 'br', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class']
      });
      
      return { __html: sanitizedHtml };
    } catch (error) {
      console.error('Error rendering markdown:', error);
      return { __html: text };
    }
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
      
      {/* Difficulty Level Selector */}
      {showDifficultySelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <DifficultyLevelSelector onClose={() => setShowDifficultySelector(false)} />
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
              onClick={() => window.location.href = '/analytics'}
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
                <Mic className="h-3 w-3 mr-1" />
                Voice
              </button>
            </div>
            
            {/* Right Controls */}
            <div className="flex items-center space-x-2">
              {/* Difficulty Level Button */}
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Sliders className="h-3 w-3" />}
                onClick={handleOpenDifficultySelector}
              >
                {difficultyLevel}
              </Button>
              
              {/* Feedback Prevention Toggle */}
              {learningMode === 'videocall' && (
                <Button
                  variant={feedbackPreventionEnabled ? "primary" : "outline"}
                  size="sm"
                  leftIcon={<Shield className="h-3 w-3" />}
                  onClick={() => {
                    setFeedbackPreventionEnabled(!feedbackPreventionEnabled);
                    toggleFeedbackPrevention();
                  }}
                  className="text-xs"
                >
                  {feedbackPreventionEnabled ? "Feedback Prevention On" : "Feedback Prevention Off"}
                </Button>
              )}
              
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
          )}
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
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
                        <MessageSquare className="h-8 w-8 text-primary-600" />
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
                        {feedbackPreventionEnabled && (
                          <div className="flex items-center mt-2 text-green-600 text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            <span>Feedback prevention active</span>
                          </div>
                        )}
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
                          {message.sender === 'user' ? (
                            <div className="text-sm whitespace-pre-wrap">{message.text}</div>
                          ) : (
                            <div 
                              className="text-sm markdown-content"
                              dangerouslySetInnerHTML={renderMarkdown(message.text)}
                            />
                          )}
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
                {learningMode === 'conversational' ? (
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
                    
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={!textInput.trim() || isProcessing}
                      isLoading={isProcessing}
                      className="px-3"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </form>
                ) : (
                  <div className="flex flex-col space-y-3">
                    {/* Voice Input Controls */}
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant={isActive ? "secondary" : "primary"}
                        onClick={toggleVoiceMode}
                        disabled={isProcessing}
                        className="px-3"
                      >
                        {isActive ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                      </Button>
                      
                      <div className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-500">
                        {currentTranscript || "Click the microphone to start speaking..."}
                      </div>
                      
                      {currentTranscript && (
                        <Button
                          type="button"
                          variant="primary"
                          onClick={forceSubmitTranscript}
                          disabled={isProcessing}
                          className="px-3"
                        >
                          <Send className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                    
                    {/* Audio Visualization */}
                    <AudioVisualizer 
                      audioData={visualizationData || []}
                      isActive={isActive}
                      height={40}
                      showAIFilter={isSpeaking && feedbackPreventionEnabled}
                    />
                    
                    {/* Feedback Prevention Status */}
                    {feedbackPreventionEnabled && (
                      <div className="flex items-center justify-center space-x-2 text-xs text-green-600 bg-green-50 py-1 px-2 rounded-md border border-green-200">
                        <Shield className="h-3 w-3" />
                        <span>Feedback prevention active - microphone will automatically mute while AI is speaking</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
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
            
            {feedbackPreventionEnabled && learningMode === 'videocall' && (
              <div className="flex items-center space-x-1 text-green-600">
                <Shield className="h-3 w-3" />
                <span>Feedback Prevention</span>
              </div>
            )}
          </div>
          
          <div>
            Duration: {Math.floor((Date.now() - sessionStats.startTime.getTime()) / 60000)} min
          </div>
        </div>
      </div>

      {/* Add custom styles for markdown content */}
      <style jsx>{`
        .markdown-content h1, .markdown-content h2, .markdown-content h3, 
        .markdown-content h4, .markdown-content h5, .markdown-content h6 {
          font-weight: 600;
          margin-top: 1em;
          margin-bottom: 0.5em;
        }
        
        .markdown-content h1 { font-size: 1.5em; }
        .markdown-content h2 { font-size: 1.3em; }
        .markdown-content h3 { font-size: 1.2em; }
        .markdown-content h4 { font-size: 1.1em; }
        .markdown-content h5, .markdown-content h6 { font-size: 1em; }
        
        .markdown-content p {
          margin-bottom: 0.75em;
        }
        
        .markdown-content ul, .markdown-content ol {
          margin-top: 0.5em;
          margin-bottom: 0.5em;
          padding-left: 1.5em;
        }
        
        .markdown-content ul {
          list-style-type: disc;
        }
        
        .markdown-content ol {
          list-style-type: decimal;
        }
        
        .markdown-content li {
          margin-bottom: 0.25em;
        }
        
        .markdown-content a {
          color: #2563eb;
          text-decoration: underline;
        }
        
        .markdown-content blockquote {
          border-left: 3px solid #d1d5db;
          padding-left: 1em;
          margin-left: 0;
          margin-right: 0;
          font-style: italic;
          color: #4b5563;
        }
        
        .markdown-content code {
          background-color: #f3f4f6;
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-family: monospace;
          font-size: 0.9em;
        }
        
        .markdown-content pre {
          background-color: #f3f4f6;
          padding: 1em;
          border-radius: 5px;
          overflow-x: auto;
          margin: 0.5em 0;
        }
        
        .markdown-content pre code {
          background-color: transparent;
          padding: 0;
          border-radius: 0;
        }
        
        .markdown-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
        }
        
        .markdown-content th, .markdown-content td {
          border: 1px solid #d1d5db;
          padding: 0.5em;
          text-align: left;
        }
        
        .markdown-content th {
          background-color: #f3f4f6;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default UnifiedStudyInterface;