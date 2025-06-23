import React, { useState, useRef, useEffect } from 'react';
import { Smile, Send, ChevronLeft, ChevronRight } from 'lucide-react';

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  read: boolean;
}

interface TextChatSidebarProps {
  open: boolean;
  onClose: () => void;
  messages: Message[];
  onSend: (content: string) => void;
  typingUsers: string[];
  currentUser: string;
}

const TextChatSidebar: React.FC<TextChatSidebarProps> = ({ open, onClose, messages, onSend, typingUsers, currentUser }) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleSend = () => {
    if (input.trim()) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <aside className={`fixed right-0 top-0 h-full w-80 bg-white shadow-lg z-40 transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex items-center justify-between p-4 border-b">
        <span className="font-semibold">Chat</span>
        <button onClick={onClose} aria-label="Close chat">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === currentUser ? 'items-end' : 'items-start'}`}>
            <div className={`rounded-lg px-3 py-2 mb-1 ${msg.sender === currentUser ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-800'}`}>
              <span>{msg.content}</span>
            </div>
            <span className="text-xs text-gray-400">
              {msg.sender} · {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {msg.read && <span className="ml-1 text-green-500">✓</span>}
            </span>
          </div>
        ))}
        {typingUsers.length > 0 && (
          <div className="text-xs text-gray-500 italic mt-2">
            {typingUsers.join(', ')} typing...
          </div>
        )}
      </div>
      <div className="flex items-center p-4 border-t">
        <button className="mr-2 p-2 rounded-full hover:bg-gray-100">
          <Smile className="w-5 h-5" />
        </button>
        <input
          ref={inputRef}
          type="text"
          className="flex-1 border rounded-lg px-3 py-2 mr-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
          placeholder="Type a message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
        />
        <button
          className="p-2 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition"
          onClick={handleSend}
          aria-label="Send"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
};

export default TextChatSidebar;
