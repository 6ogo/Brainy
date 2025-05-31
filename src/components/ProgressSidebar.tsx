import React from 'react';
import { Clock, BarChart } from 'lucide-react';
import { useStore } from '../store/store';
import { useSessionTimer } from '../hooks/useSessionTimer';

export const ProgressSidebar: React.FC = () => {
  const { sessionStats, currentSubject } = useStore();
  const { formattedTime } = useSessionTimer();
  
  // Mock data for progress visualization
  const mockTopics = [
    { name: 'Derivatives', progress: 85 },
    { name: 'Integrals', progress: 60 },
    { name: 'Limits', progress: 40 },
  ];
  
  return (
    <div className="p-4 bg-gray-50 border-l border-gray-200">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Session Progress</h2>
      
      <div className="space-y-4">
        {/* Timer */}
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2 text-gray-700 mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Session Duration</span>
          </div>
          <div className="text-2xl font-bold text-primary-700">{formattedTime}</div>
        </div>
        
        {/* Stats */}
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2 text-gray-700 mb-1">
            <BarChart className="h-4 w-4" />
            <span className="text-sm font-medium">Session Stats</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-500">Subject</span>
              <p className="font-medium">{currentSubject}</p>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-500">Messages</span>
              <p className="font-medium">{sessionStats.messagesCount}</p>
            </div>
          </div>
        </div>
        
        {/* Topic Progress */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Topics Progress</h3>
          <div className="space-y-3">
            {mockTopics.map((topic) => (
              <div key={topic.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span>{topic.name}</span>
                  <span>{topic.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full"
                    style={{ width: `${topic.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Next Topics */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Suggested Next Topics</h3>
          <ul className="space-y-1">
            {['Chain Rule', 'Product Rule', 'Quotient Rule'].map((topic) => (
              <li key={topic} className="text-sm text-primary-700 flex items-center">
                <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-2"></span>
                {topic}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};