import React from 'react';
import { Card } from './Card';
import { cn, commonStyles } from '../styles/utils';
import { 
  Eye, 
  Headphones, 
  HandMetal, 
  BookOpen, 
  Brain,
  CheckCircle
} from 'lucide-react';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer
} from 'recharts';

interface LearningStyleAnalysisProps {
  learningStyle: string;
  className?: string;
}

export const LearningStyleAnalysis: React.FC<LearningStyleAnalysisProps> = ({ 
  learningStyle,
  className
}) => {
  // Generate radar chart data based on learning style
  const getRadarData = () => {
    // Base values for each learning style
    const baseValues = {
      visual: 40,
      auditory: 40,
      kinesthetic: 40,
      reading: 40
    };
    
    // Boost the primary learning style
    const data = { ...baseValues };
    switch (learningStyle) {
      case 'visual':
        data.visual = 90;
        break;
      case 'auditory':
        data.auditory = 90;
        break;
      case 'kinesthetic':
        data.kinesthetic = 90;
        break;
      case 'reading/writing':
        data.reading = 90;
        break;
    }
    
    // Add some randomness to secondary styles
    Object.keys(data).forEach(key => {
      if (key !== learningStyle) {
        data[key as keyof typeof data] += Math.floor(Math.random() * 20);
      }
    });
    
    // Format for radar chart
    return [
      { subject: 'Visual', A: data.visual },
      { subject: 'Auditory', A: data.auditory },
      { subject: 'Kinesthetic', A: data.kinesthetic },
      { subject: 'Reading/Writing', A: data.reading }
    ];
  };
  
  // Get learning style tips
  const getLearningStyleTips = () => {
    switch (learningStyle) {
      case 'visual':
        return [
          'Use diagrams, charts, and mind maps',
          'Color-code your notes and materials',
          'Watch educational videos and demonstrations',
          'Visualize concepts and processes in your mind',
          'Use flashcards with images or symbols'
        ];
      case 'auditory':
        return [
          'Record lectures and listen to them again',
          'Read material aloud to yourself',
          'Discuss concepts with others',
          'Use mnemonic devices and rhymes',
          'Listen to educational podcasts or audiobooks'
        ];
      case 'kinesthetic':
        return [
          'Take frequent breaks to move around',
          'Use physical objects to represent concepts',
          'Act out processes or scenarios',
          'Create models or diagrams by hand',
          'Study while standing or walking'
        ];
      case 'reading/writing':
        return [
          'Take detailed notes in your own words',
          'Rewrite key concepts multiple times',
          'Create lists, outlines, and summaries',
          'Use written flashcards for review',
          'Write practice essays or explanations'
        ];
      default:
        return [
          'Experiment with different study techniques',
          'Combine visual, auditory, and hands-on methods',
          'Take notes in different formats',
          'Vary your study environment',
          'Pay attention to which methods help you retain information best'
        ];
    }
  };
  
  // Get learning style icon
  const getLearningStyleIcon = () => {
    switch (learningStyle) {
      case 'visual':
        return <Eye className="h-6 w-6 text-blue-600" />;
      case 'auditory':
        return <Headphones className="h-6 w-6 text-purple-600" />;
      case 'kinesthetic':
        return <HandMetal className="h-6 w-6 text-green-600" />;
      case 'reading/writing':
        return <BookOpen className="h-6 w-6 text-amber-600" />;
      default:
        return <Brain className="h-6 w-6 text-gray-600" />;
    }
  };
  
  // Get learning style color
  const getLearningStyleColor = () => {
    switch (learningStyle) {
      case 'visual':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'auditory':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'kinesthetic':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'reading/writing':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  return (
    <Card className={cn("p-6", className)}>
      <h3 className={cn(commonStyles.heading.h3, "mb-6")}>
        Learning Style Analysis
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className={cn(
            "p-4 rounded-lg border mb-6",
            getLearningStyleColor()
          )}>
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-white bg-opacity-50 rounded-full">
                {getLearningStyleIcon()}
              </div>
              <div>
                <h4 className="font-semibold text-lg capitalize">{learningStyle} Learner</h4>
                <p className="text-sm opacity-90">Your primary learning style</p>
              </div>
            </div>
            
            <p className="text-sm mb-4">
              {learningStyle === 'visual' && 'You learn best through images, diagrams, and spatial understanding. Visual information helps you process and retain knowledge more effectively.'}
              {learningStyle === 'auditory' && 'You learn best through listening and speaking. Verbal information and discussions help you process and retain knowledge more effectively.'}
              {learningStyle === 'kinesthetic' && 'You learn best through physical activities and hands-on experiences. Movement and touch help you process and retain knowledge more effectively.'}
              {learningStyle === 'reading/writing' && 'You learn best through text-based materials. Reading and writing help you process and retain knowledge more effectively.'}
            </p>
            
            <h5 className="font-medium mb-2">Recommended Study Techniques:</h5>
            <ul className="space-y-2">
              {getLearningStyleTips().map((tip, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Learning Style Comparison</h4>
            <p className="text-sm text-gray-600 mb-4">
              While your primary learning style is <span className="font-medium capitalize">{learningStyle}</span>, 
              most people use a combination of styles. Understanding your strengths can help you choose the most 
              effective study methods.
            </p>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-blue-600" />
                <span className="text-gray-700">Visual: images, diagrams</span>
              </div>
              <div className="flex items-center space-x-2">
                <Headphones className="h-4 w-4 text-purple-600" />
                <span className="text-gray-700">Auditory: listening, discussing</span>
              </div>
              <div className="flex items-center space-x-2">
                <HandMetal className="h-4 w-4 text-green-600" />
                <span className="text-gray-700">Kinesthetic: hands-on, movement</span>
              </div>
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-amber-600" />
                <span className="text-gray-700">Reading/Writing: text-based</span>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Learning Style Profile</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={getRadarData()}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar
                  name="Learning Style"
                  dataKey="A"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3">Optimize Your Learning</h4>
            <div className="p-4 bg-primary-50 border border-primary-100 rounded-lg">
              <p className="text-sm text-primary-700 mb-3">
                For the most effective learning experience, try these personalized strategies:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <div className="p-1 bg-primary-100 rounded-full mr-2 mt-0.5">
                    <Brain className="h-3 w-3 text-primary-700" />
                  </div>
                  <span className="text-sm text-primary-700">
                    {learningStyle === 'visual' && 'Request diagrams and visual explanations from your AI tutor'}
                    {learningStyle === 'auditory' && 'Use voice chat mode for better retention of concepts'}
                    {learningStyle === 'kinesthetic' && 'Take breaks between concepts to physically implement or model what you\'ve learned'}
                    {learningStyle === 'reading/writing' && 'Ask the AI tutor for written summaries you can review later'}
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="p-1 bg-primary-100 rounded-full mr-2 mt-0.5">
                    <Brain className="h-3 w-3 text-primary-700" />
                  </div>
                  <span className="text-sm text-primary-700">
                    Study during your peak time ({analyticsData.peakStudyTime}) when possible
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="p-1 bg-primary-100 rounded-full mr-2 mt-0.5">
                    <Brain className="h-3 w-3 text-primary-700" />
                  </div>
                  <span className="text-sm text-primary-700">
                    {analyticsData.averageSessionLength < 15 
                      ? 'Try to extend your study sessions to at least 15-20 minutes for better retention'
                      : 'Your session length is good. Continue with similar duration sessions'}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default LearningStyleAnalysis;