import React, { useEffect, useState } from 'react';
import { Card } from './Card';
import { cn, commonStyles } from '../styles/utils';
import { useStore } from '../store/store';
import { Button } from './Button';
import { ArrowLeft, MessageSquare, Video, Loader, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ConvaiTutorInterfaceProps {
  agentId: string;
  tutorName: string;
  className?: string;
}

export const ConvaiTutorInterface: React.FC<ConvaiTutorInterfaceProps> = ({
  agentId,
  tutorName,
  className
}) => {
  const { currentSubject, difficultyLevel } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWidgetReady, setIsWidgetReady] = useState(false);

  useEffect(() => {
    // Check if the Convai script is already loaded
    const existingScript = document.getElementById('convai-widget-script');
    
    if (!existingScript) {
      // Load the Convai widget script
      const script = document.createElement('script');
      script.id = 'convai-widget-script';
      script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
      script.async = true;
      script.type = 'text/javascript';
      
      script.onload = () => {
        console.log('Convai widget script loaded successfully');
        setIsWidgetReady(true);
        setIsLoading(false);
      };
      
      script.onerror = () => {
        console.error('Failed to load Convai widget script');
        setError('Failed to load tutor interface. Please try again later.');
        setIsLoading(false);
      };
      
      document.body.appendChild(script);
    } else {
      // Script already exists
      setIsWidgetReady(true);
      setIsLoading(false);
    }
    
    return () => {
      // Cleanup is handled by the widget itself
    };
  }, []);

  // Create the Convai element when the widget is ready
  useEffect(() => {
    if (isWidgetReady && agentId) {
      // Check if the element already exists
      const existingElement = document.querySelector(`elevenlabs-convai[agent-id="${agentId}"]`);
      
      if (!existingElement) {
        try {
          // Create the Convai element
          const convaiElement = document.createElement('elevenlabs-convai');
          convaiElement.setAttribute('agent-id', agentId);
          
          // Append to a container in our component
          const container = document.getElementById(`convai-container-${agentId}`);
          if (container) {
            container.innerHTML = ''; // Clear any previous content
            container.appendChild(convaiElement);
          }
        } catch (err) {
          console.error('Error creating Convai element:', err);
          setError('Failed to initialize tutor interface. Please try again later.');
        }
      }
    }
  }, [isWidgetReady, agentId]);

  if (isLoading) {
    return (
      <Card className={cn("p-6 flex flex-col items-center justify-center min-h-[400px]", className)}>
        <Loader className="h-12 w-12 text-primary-500 animate-spin mb-4" />
        <p className="text-gray-600">Loading {tutorName} tutor interface...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("p-6 flex flex-col items-center justify-center min-h-[400px]", className)}>
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Connection Error</h3>
        <p className="text-gray-600 mb-4 text-center">{error}</p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden flex flex-col", className)}>
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to="/subjects" className="text-primary-600 hover:text-primary-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{tutorName}</h2>
            <p className="text-sm text-gray-600">{currentSubject} • {difficultyLevel}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<MessageSquare className="h-4 w-4" />}
            onClick={() => window.location.href = '/study'}
          >
            Text Chat
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Video className="h-4 w-4" />}
            onClick={() => window.location.href = '/study'}
          >
            Voice Chat
          </Button>
        </div>
      </div>
      
      <div className="flex-1 min-h-[500px]" id={`convai-container-${agentId}`}>
        {/* The Convai widget will be inserted here */}
      </div>
    </Card>
  );
};

export default ConvaiTutorInterface;