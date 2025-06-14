import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Brain, Book, FlaskRound as Flask, Languages as Language, History, GraduationCap, Lock } from 'lucide-react';
import { useStore } from '../store/store';
import { Subject } from '../types';
import { Card } from '../components/Card';
import { cn, commonStyles } from '../styles/utils';
import { getCurrentSubscription } from '../services/subscriptionService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const subjects: Array<{
  id: Subject;
  name: string;
  icon: React.ElementType;
  description: string;
  color: string;
  freeAccess: boolean;
}> = [
  {
    id: 'Math',
    name: 'Mathematics',
    icon: Brain,
    description: 'Master calculus, algebra, and more with interactive problem-solving',
    color: 'bg-blue-500',
    freeAccess: true,
  },
  {
    id: 'English',
    name: 'English',
    icon: Book,
    description: 'Improve writing, grammar, and literature analysis',
    color: 'bg-purple-500',
    freeAccess: true,
  },
  {
    id: 'Science',
    name: 'Science',
    icon: Flask,
    description: 'Explore physics, chemistry, and biology through experiments',
    color: 'bg-green-500',
    freeAccess: false,
  },
  {
    id: 'History',
    name: 'History',
    icon: History,
    description: 'Journey through world events and cultural developments',
    color: 'bg-amber-500',
    freeAccess: false,
  },
  {
    id: 'Languages',
    name: 'Languages',
    icon: Language,
    description: 'Learn new languages through immersive conversations',
    color: 'bg-rose-500',
    freeAccess: false,
  },
  {
    id: 'Test Prep',
    name: 'Test Prep',
    icon: GraduationCap,
    description: 'Prepare for standardized tests with targeted practice',
    color: 'bg-indigo-500',
    freeAccess: false,
  },
];

export const SubjectSelection: React.FC = () => {
  const { setCurrentSubject } = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        const currentSubscription = await getCurrentSubscription();
        setSubscription(currentSubscription);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user]);

  const hasAccess = (subject: typeof subjects[0]) => {
    if (subject.freeAccess) return true;
    if (!subscription) return false;
    
    // Check if user has premium or ultimate subscription
    return subscription.subscription_level === 'premium' || subscription.subscription_level === 'ultimate';
  };

  const handleSubjectSelect = (subject: Subject, subjectData: typeof subjects[0]) => {
    if (!hasAccess(subjectData)) {
      toast.error('Upgrade to access this subject');
      return;
    }
    
    setCurrentSubject(subject);
    navigate('/teachers');
  };

  const handleUpgradeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/pricing');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className={cn(commonStyles.heading.h1, "mb-4")}>
              Choose Your Subject
            </h1>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className={cn(commonStyles.heading.h1, "mb-4")}>
            Choose Your Subject
          </h1>
          <p className={cn(commonStyles.text.lg, "max-w-2xl mx-auto")}>
            Select a subject to start your personalized learning session with your AI tutor
          </p>
          
          {/* Subscription Status */}
          <div className="mt-6 inline-flex items-center px-4 py-2 bg-white rounded-full shadow-sm border">
            <div className={cn(
              "w-2 h-2 rounded-full mr-2",
              subscription?.subscription_level === 'premium' ? 'bg-blue-500' :
              subscription?.subscription_level === 'ultimate' ? 'bg-purple-500' :
              'bg-gray-400'
            )}></div>
            <span className="text-sm font-medium text-gray-700">
              {subscription?.subscription_level === 'premium' ? 'Premium Plan' :
               subscription?.subscription_level === 'ultimate' ? 'Ultimate Plan' :
               'Free Plan'}
            </span>
            {(!subscription || subscription.subscription_level === 'free') && (
              <Link 
                to="/pricing" 
                className="ml-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Upgrade
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => {
            const hasSubjectAccess = hasAccess(subject);
            
            return (
              <div key={subject.id} className="relative">
                <Card
                  variant={hasSubjectAccess ? "interactive" : "base"}
                  className={cn(
                    "p-6 transition-all duration-300",
                    hasSubjectAccess 
                      ? "cursor-pointer hover:shadow-lg" 
                      : "opacity-60 cursor-not-allowed bg-gray-50"
                  )}
                  onClick={() => hasSubjectAccess && handleSubjectSelect(subject.id, subject)}
                >
                  <div className="flex items-start space-x-4">
                    <div className={cn(
                      "p-3 rounded-lg text-white relative",
                      hasSubjectAccess ? subject.color : "bg-gray-400"
                    )}>
                      {hasSubjectAccess ? (
                        <subject.icon className="h-6 w-6" />
                      ) : (
                        <Lock className="h-6 w-6" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className={cn(
                          commonStyles.heading.h3,
                          hasSubjectAccess ? "text-gray-900" : "text-gray-500"
                        )}>
                          {subject.name}
                        </h3>
                        {!hasSubjectAccess && (
                          <div className="flex items-center space-x-1">
                            <Lock className="h-4 w-4 text-gray-400" />
                            <span className="text-xs text-gray-400 font-medium">Premium</span>
                          </div>
                        )}
                      </div>
                      <p className={cn(
                        commonStyles.text.base,
                        hasSubjectAccess ? "text-gray-600" : "text-gray-400"
                      )}>
                        {subject.description}
                      </p>
                      
                      {!hasSubjectAccess && (
                        <div className="mt-3">
                          <button
                            onClick={handleUpgradeClick}
                            className="inline-flex items-center px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
                          >
                            <Lock className="h-3 w-3 mr-1" />
                            Upgrade to Access
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Hover tooltip for locked subjects */}
                {!hasSubjectAccess && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <div className="bg-black text-white text-sm px-3 py-2 rounded-lg shadow-lg">
                      Upgrade to access this subject
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Free Plan Notice */}
        {(!subscription || subscription.subscription_level === 'free') && (
          <div className="mt-12 text-center">
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Brain className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <h3 className={cn(commonStyles.heading.h3, "mb-2")}>
                Unlock All Subjects
              </h3>
              <p className={cn(commonStyles.text.base, "mb-4")}>
                Get access to Science, History, Languages, and Test Prep with a premium subscription
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/pricing"
                  className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  View Pricing Plans
                </Link>
                <Link
                  to="/pricing"
                  className="inline-flex items-center px-6 py-3 bg-white text-primary-600 font-medium rounded-lg border border-primary-600 hover:bg-primary-50 transition-colors"
                >
                  Learn More
                </Link>
              </div>
            </Card>
          </div>
        )}

        {/* Premium Benefits */}
        <div className="mt-12">
          <Card className="p-6">
            <h3 className={cn(commonStyles.heading.h3, "mb-4 text-center")}>
              What You Get With Premium
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="p-3 bg-green-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <Flask className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">All Subjects</h4>
                <p className="text-sm text-gray-600">Access to Science, History, Languages & more</p>
              </div>
              
              <div className="text-center">
                <div className="p-3 bg-blue-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <Brain className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Extended Sessions</h4>
                <p className="text-sm text-gray-600">4 hours daily conversation time</p>
              </div>
              
              <div className="text-center">
                <div className="p-3 bg-purple-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Video Calls</h4>
                <p className="text-sm text-gray-600">30 minutes of video tutoring daily</p>
              </div>
              
              <div className="text-center">
                <div className="p-3 bg-amber-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <History className="h-6 w-6 text-amber-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Advanced Analytics</h4>
                <p className="text-sm text-gray-600">Detailed progress tracking & insights</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};