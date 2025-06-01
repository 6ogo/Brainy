import React, { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Search, Send } from 'lucide-react';
import { useStore } from '../store/store';
import { useConversation } from '../hooks/useConversation';
import { cn, commonStyles } from '../styles/utils';

export const ChatTranscript: React.FC = () => {
  const { messages } = useStore();
  const { sendMessage, isProcessing } = useConversation();
  const [searchTerm, setSearchTerm] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [inputMessage]);

  const filteredMessages = searchTerm
    ? messages.filter(msg => 
        msg.text.toLowerCase().includes(searchTerm.toLowerCase()))
    : messages;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isProcessing) return;

    const message = inputMessage;
    setInputMessage('');
    await sendMessage(message);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm">
      {/* Search bar */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
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
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 text-sm">
              {searchTerm ? 'No matching messages found' : 'Start your conversation with your AI tutor'}
            </p>
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
                  "max-w-[80%] rounded-lg px-4 py-2",
                  message.sender === 'user'
                    ? "bg-primary-100 text-primary-800"
                    : "bg-gray-100 text-gray-800"
                )}
              >
                <div className="text-sm whitespace-pre-wrap">{message.text}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {format(message.timestamp, 'h:mm a')}
                </div>
              </div>
            </div>
          ))
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
            placeholder="Type your message..."
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
              "px-3 py-2"
            )}
            disabled={!inputMessage.trim() || isProcessing}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
};