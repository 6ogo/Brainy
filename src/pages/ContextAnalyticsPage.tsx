import React, { useEffect } from 'react';
import { Header } from '../components/Header';
import { ContextAnalyticsDashboard } from '../components/ContextAnalyticsDashboard';
import { Button } from '../components/Button';
import { Link } from 'react-router-dom';
import { ArrowLeft, Brain } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const ContextAnalyticsPage: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <Link 
                to="/analytics" 
                className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Analytics
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">
              Context Management Analytics
            </h1>
            <p className="text-gray-600">
              Track context retention, memory usage, and response relevance across your conversations
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/study'}
            >
              Continue Learning
            </Button>
            <Button
              variant="primary"
              leftIcon={<Brain className="h-4 w-4" />}
              onClick={() => window.location.href = '/personalized-learning'}
            >
              View Learning Paths
            </Button>
          </div>
        </div>
        
        {/* Main Content */}
        <ContextAnalyticsDashboard />
        
        {/* Additional Information */}
        <div className="mt-8 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            About Context Management
          </h2>
          <p className="text-gray-700 mb-4">
            Context management is a critical aspect of AI-powered learning. It refers to how well the AI system maintains and utilizes information from previous parts of your conversation to provide relevant, coherent responses.
          </p>
          <p className="text-gray-700 mb-4">
            This dashboard helps you understand how effectively context is being maintained in your learning sessions, identify patterns of context loss or degradation, and discover strategies to improve context retention for more effective learning.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h3 className="font-medium text-blue-800 mb-2">Context Retention</h3>
              <p className="text-sm text-blue-700">
                Measures how well the AI remembers and utilizes information from earlier in the conversation.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <h3 className="font-medium text-green-800 mb-2">Memory Efficiency</h3>
              <p className="text-sm text-green-700">
                Tracks how efficiently the AI uses its available memory to store and process conversation context.
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
              <h3 className="font-medium text-purple-800 mb-2">Response Relevance</h3>
              <p className="text-sm text-purple-700">
                Evaluates how relevant and coherent AI responses are to the current conversation context.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContextAnalyticsPage;