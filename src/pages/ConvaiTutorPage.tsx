import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { ConvaiTutorInterface } from '../components/ConvaiTutorInterface';
import { useStore } from '../store/store';
import { useAuth } from '../contexts/AuthContext';

export const ConvaiTutorPage: React.FC = () => {
  const { tutorId } = useParams<{ tutorId: string }>();
  const { currentSubject, currentAvatar } = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Map tutor IDs to agent IDs and names
  const tutorMap: Record<string, { agentId: string, name: string }> = {
    'emma': { 
      agentId: 'agent_01jyve5demfdna7y6801z1rcsy', 
      name: 'Encouraging Emma' 
    },
    'charlie': { 
      agentId: 'agent_01jyve3h3af7w9hj52b9a9zm5a', 
      name: 'Challenge Charlie' 
    },
    'freddy': { 
      agentId: 'agent_01jyvdwb1cfw1a6rdhm7rfecqj', 
      name: 'Fun Freddy' 
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!currentSubject) {
      navigate('/subjects');
      return;
    }

    if (!tutorId || !tutorMap[tutorId]) {
      navigate('/teachers');
      return;
    }
    
    window.scrollTo(0, 0);
  }, [tutorId, currentSubject, user, navigate]);

  if (!tutorId || !tutorMap[tutorId]) {
    return null;
  }

  const { agentId, name } = tutorMap[tutorId];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1 container mx-auto px-4 py-6 max-w-6xl">
        <ConvaiTutorInterface 
          agentId={agentId} 
          tutorName={name} 
        />
      </div>
    </div>
  );
};

export default ConvaiTutorPage;