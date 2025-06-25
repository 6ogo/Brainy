import React, { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Search, Send, Phone, Info } from 'lucide-react';
import { VoiceControls } from './VoiceControls';
import { useStore } from '../store/store';
import { useConversation } from '../hooks/useConversation';
import { useVoiceChat } from '../hooks/useVoiceChat';
import { cn, commonStyles } from '../styles/utils';
import toast from 'react-hot-toast';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { StudyModeIndicator } from './StudyModeIndicator';

export const ChatTranscript: React.FC = () => {
  const { 
    messages, 
    learningMode, 
    isSpeaking, 
    setLearningMode, 
    difficultyLevel, 
    voiceMode, 
    setVoiceMode,
    isStudyMode
  } = useStore();
  
  const { sendMessage, isProcessing } = useConversation();
  const { currentTranscript } = useVoiceChat();
  const [searchTerm, setSearchTerm] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const {
    transcript,
    listening,
    browserSupportsSpeechRecognition,
    startListening,
    stopListening
  } = useSpeechRecognition();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentTranscript, transcript]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [inputMessage]);

  // Update voice mode based on learning mode
  useEffect(() => {
    setIsVoiceMode(learningMode === 'videocall');
  }, [learningMode]);

  const filteredMessages = searchTerm
    ? messages.filter(msg => 
        msg.text.toLowerCase().includes(searchTerm.toLowerCase()))
    : messages;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isProcessing) return;

    const message = inputMessage;
    setInputMessage('');
    await sendMessage(message, isVoiceMode);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm">
      {/* Header with mode toggle */}
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <div className="relative flex-1 mr-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversation..."
            className={cn(
              commonStyles.input.base,
              "pl-10 pr-3 py-2 text-sm"
            )}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Study Mode Indicator */}
        {isStudyMode && (
          <div className="mr-4">
            <StudyModeIndicator />
          </div>
        )}
        
        {/* Difficulty level indicator */}
        <div className="mr-4 px-3 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full border border-primary-100">
          {difficultyLevel} Level
        </div>
        
        {/* Voice/Text Mode Toggle */}
        <div className="ml-4">
          <VoiceControls />
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 text-sm">
              {searchTerm ? 'No matching messages found' : 'Start your conversation with your AI tutor'}
            </p>
            <p className="text-gray-400 text-xs mt-2">
              {isVoiceMode ? 'Voice responses enabled' : 'Text-only mode'}
            </p>
            {isStudyMode && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg max-w-md mx-auto">
                <p className="text-amber-700 text-sm font-medium">Study Mode Active</p>
                <p className="text-amber-600 text-xs mt-1">
                  Responses will be concise and focused on essential information
                </p>
              </div>
            )}
          </div>
        ) : (
          filteredMessages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.sender === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-4 py-2 relative",
                  message.sender === 'user'
                    ? "bg-primary-100 text-primary-800"
                    : "bg-gray-100 text-gray-800"
                )}
              >
                <div className="text-sm whitespace-pre-wrap">{message.text}</div>
                <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
                  <span>{format(message.timestamp, 'h:mm a')}</span>
                  {message.sender === 'ai' && isVoiceMode && (
                    <span className="ml-2 text-green-600">
                      🔊
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Live transcript */}
        {(currentTranscript || transcript) && (
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-lg px-4 py-2 bg-blue-50 text-blue-800 border border-blue-100">
              <div className="flex items-center space-x-2 mb-1">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs font-medium">Listening...</span>
              </div>
              <div className="text-sm">{currentTranscript || transcript}</div>
            </div>
          </div>
        )}
        
        {/* Speaking indicator */}
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
        
        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200">
        <div className="flex items-end space-x-2">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={isVoiceMode ? "Type your message (voice response enabled)..." : "Type your message..."}
            className={cn(
              commonStyles.input.base,
              "resize-none min-h-[40px] max-h-[120px] py-2"
            )}
            rows={1}
            disabled={isProcessing}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            className={cn(
              commonStyles.button.primary,
              "px-3 py-2 flex items-center space-x-1"
            )}
            disabled={!inputMessage.trim() || isProcessing}
          >
            <Send className="h-5 w-5" />
            {isVoiceMode && <span className="text-xs">🔊</span>}
          </button>
        </div>
        
        {isVoiceMode && (
          <p className="text-xs text-green-600 mt-1 flex items-center">
            <Phone className="h-3 w-3 mr-1" />
            Voice responses enabled - you'll hear the AI tutor speak
          </p>
        )}
        
        {isStudyMode && (
          <p className="text-xs text-amber-600 mt-1 flex items-center">
            <Info className="h-3 w-3 mr-1" />
            Study Mode - responses will be concise and focused on key information
          </p>
        )}
      </form>
    </div>
  );
};