import React, { useState, useEffect } from 'react';
import { ChevronDown, Lock } from 'lucide-react';
import { useStore } from '../store/store';
import { Subject } from '../types';
import { cn, commonStyles } from '../styles/utils';
import { getCurrentSubscription } from '../services/subscriptionService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const SubjectSelector: React.FC = () => {
  const { currentSubject, setCurrentSubject } = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

  const subjects: Array<{
    id: Subject;
    name: string;
    freeAccess: boolean;
  }> = [
    { id: 'Math', name: 'Mathematics', freeAccess: true },
    { id: 'English', name: 'English', freeAccess: true },
    { id: 'Science', name: 'Science', freeAccess: false },
    { id: 'History', name: 'History', freeAccess: false },
    { id: 'Languages', name: 'Languages', freeAccess: false },
    { id: 'Test Prep', name: 'Test Prep', freeAccess: false },
  ];

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) return;
      
      try {
        const currentSubscription = await getCurrentSubscription();
        setSubscription(currentSubscription);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      }
    };

    fetchSubscription();
  }, [user]);

  const hasAccess = (subject: typeof subjects[0]) => {
    if (subject.freeAccess) return true;
    if (!subscription) return false;
    
    return subscription.subscription_level === 'premium' || subscription.subscription_level === 'ultimate';
  };

  const handleSubjectChange = (subject: Subject, subjectData: typeof subjects[0]) => {
    if (!hasAccess(subjectData)) {
      toast.error('Upgrade to access this subject');
      navigate('/pricing');
      setIsOpen(false);
      return;
    }
    
    setCurrentSubject(subject);
    setIsOpen(false);
  };

  const selectedSubject = subjects.find(subject => subject.id === currentSubject);

  return (
    <div className="relative">
      <button
        type="button"
        className={cn(
          commonStyles.button.outline,
          "inline-flex items-center px-3 py-2 text-sm leading-4 font-medium",
          "text-gray-700 hover:bg-gray-50 focus:ring-primary-500"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center">
          {selectedSubject?.name || currentSubject}
          {selectedSubject && !hasAccess(selectedSubject) && (
            <Lock className="ml-1 h-3 w-3 text-gray-400" />
          )}
        </span>
        <ChevronDown className="ml-2 h-4 w-4" />
      </button>

      {isOpen && (
        <div className={cn(
          commonStyles.card.base,
          "origin-top-right absolute right-0 mt-2 w-56 z-10"
        )}>
          <div 
            className="py-1"
            role="menu" 
            aria-orientation="vertical"
          >
            {subjects.map((subject) => {
              const hasSubjectAccess = hasAccess(subject);
              
              return (
                <button
                  key={subject.id}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm flex items-center justify-between",
                    currentSubject === subject.id
                      ? "bg-primary-50 text-primary-700 font-medium"
                      : hasSubjectAccess 
                        ? "text-gray-700 hover:bg-gray-100"
                        : "text-gray-400 cursor-not-allowed"
                  )}
                  onClick={() => handleSubjectChange(subject.id, subject)}
                  disabled={!hasSubjectAccess}
                  title={!hasSubjectAccess ? "Upgrade to access this subject" : undefined}
                >
                  <span className={cn(
                    hasSubjectAccess ? "" : "opacity-60"
                  )}>
                    {subject.name}
                  </span>
                  {!hasSubjectAccess && (
                    <div className="flex items-center space-x-1">
                      <Lock className="h-3 w-3" />
                      <span className="text-xs">Premium</span>
                    </div>
                  )}
                </button>
              );
            })}
            
            {/* Upgrade prompt for free users */}
            {(!subscription || subscription.subscription_level === 'free') && (
              <>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  className="w-full text-left px-4 py-3 text-sm bg-gradient-to-r from-primary-50 to-blue-50 hover:from-primary-100 hover:to-blue-100 transition-colors"
                  onClick={() => {
                    navigate('/pricing');
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <div className="p-1 bg-primary-100 rounded">
                      <Lock className="h-3 w-3 text-primary-600" />
                    </div>
                    <div>
                      <div className="font-medium text-primary-700">Unlock All Subjects</div>
                      <div className="text-xs text-primary-600">Upgrade to Premium</div>
                    </div>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};