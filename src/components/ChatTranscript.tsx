import React, { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Search } from 'lucide-react';
import { useStore } from '../store/store';

export const ChatTranscript: React.FC = () => {
  const { messages } = useStore();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = React.useState('');

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const filteredMessages = searchTerm
    ? messages.filter(msg => 
        msg.text.toLowerCase().includes(searchTerm.toLowerCase()))
    : messages;

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search conversation..."
            className="pl-10 pr-3 py-2 w-full text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Transcript messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 text-sm">
              {searchTerm ? 'No matching messages found' : 'Your conversation will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="text-sm">{message.text}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {format(message.timestamp, 'h:mm a')}
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};