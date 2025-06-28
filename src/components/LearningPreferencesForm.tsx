import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { cn, commonStyles } from '../styles/utils';
import { 
  Brain, 
  Clock, 
  Target, 
  BookOpen, 
  Save,
  Eye,
  Headphones,
  HandMetal,
  FileText
} from 'lucide-react';
import { Button } from './Button';
import { useAuth } from '../contexts/AuthContext';
import { 
  LearningPreferences, 
  saveUserPreferences, 
  getLearningPreferences 
} from '../services/personalizationService';
import { Subject, DifficultyLevel } from '../types';
import toast from 'react-hot-toast';

interface LearningPreferencesFormProps {
  onSave?: () => void;
  className?: string;
}

export const LearningPreferencesForm: React.FC<LearningPreferencesFormProps> = ({
  onSave,
  className
}) => {
  const { user } = useAuth();
  
  const [preferences, setPreferences] = useState<LearningPreferences>({
    userId: user?.id || '',
    learningStyle: 'visual',
    preferredDifficulty: 'High School',
    preferredPace: 'moderate',
    preferredTimeOfDay: 'afternoon',
    preferredSessionDuration: 30,
    preferredSubjects: ['Math'],
    strengths: [],
    weaknesses: [],
    goals: []
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newStrength, setNewStrength] = useState('');
  const [newWeakness, setNewWeakness] = useState('');
  const [newGoal, setNewGoal] = useState('');
  
  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);
  
  const loadPreferences = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userPreferences = await getLearningPreferences(user.id);
      setPreferences(userPreferences);
    } catch (err) {
      console.error('Error loading learning preferences:', err);
      toast.error('Failed to load your learning preferences');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSave = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      await saveUserPreferences(preferences);
      toast.success('Learning preferences saved successfully');
      onSave?.();
    } catch (err) {
      console.error('Error saving learning preferences:', err);
      toast.error('Failed to save learning preferences');
    } finally {
      setSaving(false);
    }
  };
  
  const handleChange = (field: keyof LearningPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleAddStrength = () => {
    if (!newStrength.trim()) return;
    
    setPreferences(prev => ({
      ...prev,
      strengths: [...prev.strengths, newStrength.trim()]
    }));
    
    setNewStrength('');
  };
  
  const handleRemoveStrength = (index: number) => {
    setPreferences(prev => ({
      ...prev,
      strengths: prev.strengths.filter((_, i) => i !== index)
    }));
  };
  
  const handleAddWeakness = () => {
    if (!newWeakness.trim()) return;
    
    setPreferences(prev => ({
      ...prev,
      weaknesses: [...prev.weaknesses, newWeakness.trim()]
    }));
    
    setNewWeakness('');
  };
  
  const handleRemoveWeakness = (index: number) => {
    setPreferences(prev => ({
      ...prev,
      weaknesses: prev.weaknesses.filter((_, i) => i !== index)
    }));
  };
  
  const handleAddGoal = () => {
    if (!newGoal.trim()) return;
    
    setPreferences(prev => ({
      ...prev,
      goals: [...prev.goals, newGoal.trim()]
    }));
    
    setNewGoal('');
  };
  
  const handleRemoveGoal = (index: number) => {
    setPreferences(prev => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index)
    }));
  };
  
  const handleSubjectToggle = (subject: Subject) => {
    setPreferences(prev => {
      if (prev.preferredSubjects.includes(subject)) {
        return {
          ...prev,
          preferredSubjects: prev.preferredSubjects.filter(s => s !== subject)
        };
      } else {
        return {
          ...prev,
          preferredSubjects: [...prev.preferredSubjects, subject]
        };
      }
    });
  };
  
  if (loading) {
    return (
      <Card className={cn("p-6 flex items-center justify-center", className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </Card>
    );
  }
  
  return (
    <Card className={cn("p-6", className)}>
      <h3 className={cn(commonStyles.heading.h3, "mb-6")}>
        Learning Preferences
      </h3>
      
      <div className="space-y-8">
        {/* Learning Style */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <Brain className="h-5 w-5 mr-2 text-primary-600" />
            Learning Style
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <button
              className={cn(
                "p-4 rounded-lg border transition-colors",
                preferences.learningStyle === 'visual'
                  ? "bg-blue-50 border-blue-300 ring-2 ring-blue-500"
                  : "bg-white border-gray-200 hover:bg-gray-50"
              )}
              onClick={() => handleChange('learningStyle', 'visual')}
            >
              <div className="flex flex-col items-center">
                <div className="p-2 bg-blue-100 rounded-full mb-2">
                  <Eye className="h-6 w-6 text-blue-600" />
                </div>
                <h5 className="font-medium text-gray-900 mb-1">Visual</h5>
                <p className="text-xs text-gray-500 text-center">
                  Learn through images, diagrams, and videos
                </p>
              </div>
            </button>
            
            <button
              className={cn(
                "p-4 rounded-lg border transition-colors",
                preferences.learningStyle === 'auditory'
                  ? "bg-purple-50 border-purple-300 ring-2 ring-purple-500"
                  : "bg-white border-gray-200 hover:bg-gray-50"
              )}
              onClick={() => handleChange('learningStyle', 'auditory')}
            >
              <div className="flex flex-col items-center">
                <div className="p-2 bg-purple-100 rounded-full mb-2">
                  <Headphones className="h-6 w-6 text-purple-600" />
                </div>
                <h5 className="font-medium text-gray-900 mb-1">Auditory</h5>
                <p className="text-xs text-gray-500 text-center">
                  Learn through listening and speaking
                </p>
              </div>
            </button>
            
            <button
              className={cn(
                "p-4 rounded-lg border transition-colors",
                preferences.learningStyle === 'kinesthetic'
                  ? "bg-green-50 border-green-300 ring-2 ring-green-500"
                  : "bg-white border-gray-200 hover:bg-gray-50"
              )}
              onClick={() => handleChange('learningStyle', 'kinesthetic')}
            >
              <div className="flex flex-col items-center">
                <div className="p-2 bg-green-100 rounded-full mb-2">
                  <HandMetal className="h-6 w-6 text-green-600" />
                </div>
                <h5 className="font-medium text-gray-900 mb-1">Kinesthetic</h5>
                <p className="text-xs text-gray-500 text-center">
                  Learn through physical activities and movement
                </p>
              </div>
            </button>
            
            <button
              className={cn(
                "p-4 rounded-lg border transition-colors",
                preferences.learningStyle === 'reading/writing'
                  ? "bg-amber-50 border-amber-300 ring-2 ring-amber-500"
                  : "bg-white border-gray-200 hover:bg-gray-50"
              )}
              onClick={() => handleChange('learningStyle', 'reading/writing')}
            >
              <div className="flex flex-col items-center">
                <div className="p-2 bg-amber-100 rounded-full mb-2">
                  <FileText className="h-6 w-6 text-amber-600" />
                </div>
                <h5 className="font-medium text-gray-900 mb-1">Reading/Writing</h5>
                <p className="text-xs text-gray-500 text-center">
                  Learn through text-based materials
                </p>
              </div>
            </button>
          </div>
        </div>
        
        {/* Difficulty and Pace */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-4 flex items-center">
              <Target className="h-5 w-5 mr-2 text-primary-600" />
              Preferred Difficulty
            </h4>
            
            <div className="space-y-2">
              {(['Elementary', 'High School', 'College', 'Advanced'] as DifficultyLevel[]).map((level) => (
                <label key={level} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="difficulty"
                    value={level}
                    checked={preferences.preferredDifficulty === level}
                    onChange={() => handleChange('preferredDifficulty', level)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-gray-900">{level}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-primary-600" />
              Preferred Pace
            </h4>
            
            <div className="space-y-2">
              {(['slow', 'moderate', 'fast'] as const).map((pace) => (
                <label key={pace} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="pace"
                    value={pace}
                    checked={preferences.preferredPace === pace}
                    onChange={() => handleChange('preferredPace', pace)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-gray-900 capitalize">{pace}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        
        {/* Time of Day and Session Duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-primary-600" />
              Preferred Time of Day
            </h4>
            
            <div className="space-y-2">
              {(['morning', 'afternoon', 'evening', 'night'] as const).map((time) => (
                <label key={time} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="timeOfDay"
                    value={time}
                    checked={preferences.preferredTimeOfDay === time}
                    onChange={() => handleChange('preferredTimeOfDay', time)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-gray-900 capitalize">{time}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-primary-600" />
              Preferred Session Duration
            </h4>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">15 min</span>
                <span className="text-sm text-gray-600">60 min</span>
              </div>
              
              <input
                type="range"
                min="15"
                max="60"
                step="5"
                value={preferences.preferredSessionDuration}
                onChange={(e) => handleChange('preferredSessionDuration', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              
              <div className="text-center">
                <span className="text-lg font-medium text-primary-600">
                  {preferences.preferredSessionDuration} minutes
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Preferred Subjects */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-primary-600" />
            Preferred Subjects
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(['Math', 'Science', 'English', 'History', 'Languages', 'Test Prep'] as Subject[]).map((subject) => (
              <label key={subject} className={cn(
                "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                preferences.preferredSubjects.includes(subject)
                  ? "bg-primary-50 border-primary-300"
                  : "bg-white border-gray-200 hover:bg-gray-50"
              )}>
                <input
                  type="checkbox"
                  checked={preferences.preferredSubjects.includes(subject)}
                  onChange={() => handleSubjectToggle(subject)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 rounded"
                />
                <span className="text-gray-900">{subject}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Strengths, Weaknesses, and Goals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Strengths</h4>
            
            <div className="space-y-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newStrength}
                  onChange={(e) => setNewStrength(e.target.value)}
                  placeholder="Add a strength"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddStrength}
                  disabled={!newStrength.trim()}
                >
                  Add
                </Button>
              </div>
              
              <div className="space-y-2">
                {preferences.strengths.map((strength, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-green-50 border border-green-100 rounded-lg">
                    <span className="text-sm text-green-800">{strength}</span>
                    <button
                      onClick={() => handleRemoveStrength(index)}
                      className="text-green-600 hover:text-green-800"
                    >
                      &times;
                    </button>
                  </div>
                ))}
                
                {preferences.strengths.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No strengths added yet</p>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Areas to Improve</h4>
            
            <div className="space-y-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newWeakness}
                  onChange={(e) => setNewWeakness(e.target.value)}
                  placeholder="Add an area to improve"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddWeakness}
                  disabled={!newWeakness.trim()}
                >
                  Add
                </Button>
              </div>
              
              <div className="space-y-2">
                {preferences.weaknesses.map((weakness, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-amber-50 border border-amber-100 rounded-lg">
                    <span className="text-sm text-amber-800">{weakness}</span>
                    <button
                      onClick={() => handleRemoveWeakness(index)}
                      className="text-amber-600 hover:text-amber-800"
                    >
                      &times;
                    </button>
                  </div>
                ))}
                
                {preferences.weaknesses.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No areas to improve added yet</p>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Learning Goals</h4>
            
            <div className="space-y-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  placeholder="Add a learning goal"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddGoal}
                  disabled={!newGoal.trim()}
                >
                  Add
                </Button>
              </div>
              
              <div className="space-y-2">
                {preferences.goals.map((goal, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-100 rounded-lg">
                    <span className="text-sm text-blue-800">{goal}</span>
                    <button
                      onClick={() => handleRemoveGoal(index)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      &times;
                    </button>
                  </div>
                ))}
                
                {preferences.goals.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No goals added yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={saving}
            leftIcon={<Save className="h-5 w-5" />}
          >
            Save Preferences
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default LearningPreferencesForm;