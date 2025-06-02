import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ConversationService } from '../services/conversationService';
import { TavusService } from '../services/tavusService';
import { Card } from './Card';
import { Button } from './Button';
import { Clock, MessageSquare, Video } from 'lucide-react';
import { format } from 'date-fns';
import { cn, commonStyles } from '../styles/utils';
import toast from 'react-hot-toast';

interface Conversation {
  id: string;
  user_message: string;
  ai_response: string;
  summary: string;
  timestamp: string;
  duration: number;
}

export const ConversationHistory: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [tavusEligible, setTavusEligible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [tavusVideo, setTavusVideo] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const history = await ConversationService.getConversationHistory(user.id);
        setConversations(history);

        const eligible = await TavusService.checkEligibilityForTavus(user.id);
        setTavusEligible(eligible);
      } catch (error) {
        console.error('Error fetching conversation history:', error);
        toast.error('Failed to load conversation history');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleGenerateStudyTip = async () => {
    if (!user || !tavusEligible) return;

    try {
      const learningHistory = {
        completedTopics: ['Basic Algebra', 'Linear Equations'],
        strugglingTopics: ['Quadratic Equations'],
        nextTopics: ['Polynomial Functions']
      };

      const video = await TavusService.createStudyTipVideo(
        user.id,
        'Math',
        learningHistory
      );

      setTavusVideo(video.url);
    } catch (error) {
      console.error('Error generating study tip:', error);
      toast.error('Failed to generate study tip video');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Study Progress Video */}
      {tavusEligible && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className={cn(commonStyles.heading.h3)}>
              Personalized Study Tips
            </h3>
            <Button
              variant="primary"
              onClick={handleGenerateStudyTip}
              leftIcon={<Video className="h-4 w-4" />}
            >
              Generate New Tip
            </Button>
          </div>

          {tavusVideo ? (
            <div className="aspect-video rounded-lg overflow-hidden">
              <video
                src={tavusVideo}
                controls
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <p className="text-gray-600">
              Click the button above to generate a personalized study tip video based on your learning progress.
            </p>
          )}
        </Card>
      )}

      {/* Conversation History */}
      <Card className="p-6">
        <h3 className={cn(commonStyles.heading.h3, "mb-4")}>
          Conversation History
        </h3>

        {conversations.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No conversations yet. Start learning to build your history!
          </p>
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelectedConversation(conversation)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-primary-500" />
                    <span className="font-medium">
                      {conversation.user_message.substring(0, 50)}...
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>{format(new Date(conversation.timestamp), 'PPp')}</span>
                  </div>
                </div>

                {conversation.summary && (
                  <div className="mt-2 text-sm text-gray-600">
                    <strong>Summary:</strong>
                    <p>{conversation.summary}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Conversation Detail Modal */}
      {selectedConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className={cn(commonStyles.heading.h3)}>
                  Conversation Details
                </h3>
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Your Message:</h4>
                  <p className="text-gray-600">{selectedConversation.user_message}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">AI Response:</h4>
                  <p className="text-gray-600">{selectedConversation.ai_response}</p>
                </div>

                {selectedConversation.summary && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Summary:</h4>
                    <p className="text-gray-600">{selectedConversation.summary}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                  <span>Duration: {Math.floor(selectedConversation.duration / 60)} minutes</span>
                  <span>{format(new Date(selectedConversation.timestamp), 'PPp')}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};