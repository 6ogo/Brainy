import React, { useEffect } from 'react';
import { Header } from '../components/Header';
import { UnifiedStudyInterface } from '../components/UnifiedStudyInterface';
import { useStore } from '../store/store';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const StudyPage: React.FC = () => {
  const { currentSubject, currentAvatar } = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentSubject || !currentAvatar || !user) {
      navigate('/subjects');
      return;
    }
    
    window.scrollTo(0, 0);
  }, [currentSubject, currentAvatar, navigate, user]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1">
        <UnifiedStudyInterface />
      </div>
    </div>
  );
};

export default StudyPage;