import React from 'react';
import { Card } from './Card';
import { cn, commonStyles } from '../styles/utils';
import { BookOpen, Brain, Target, CheckCircle, HelpCircle, Lightbulb } from 'lucide-react';

interface StudyModeContentProps {
  subject: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  className?: string;
}

export const StudyModeContent: React.FC<StudyModeContentProps> = ({
  subject,
  level = 'intermediate',
  className
}) => {
  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-amber-100 rounded-full">
          <BookOpen className="h-5 w-5 text-amber-600" />
        </div>
        <h3 className={cn(commonStyles.heading.h3)}>
          Study Mode: {subject}
        </h3>
      </div>

      <div className="mb-6">
        <p className="text-gray-700 mb-4">
          I am your dedicated AI learning companion, specialized in {subject} tutoring. To provide the most effective assistance, please:
        </p>

        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="p-1.5 bg-blue-100 rounded-full mt-0.5">
              <Brain className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Share your study material</h4>
              <p className="text-sm text-gray-600">
                Paste text directly, describe the topic, or ask specific questions about {subject}.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="p-1.5 bg-green-100 rounded-full mt-0.5">
              <Target className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Specify your learning goals</h4>
              <p className="text-sm text-gray-600">
                Complete understanding, exam preparation, homework help, or general exploration.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="p-1.5 bg-purple-100 rounded-full mt-0.5">
              <HelpCircle className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Indicate specific challenges</h4>
              <p className="text-sm text-gray-600">
                Let me know what aspects of the material are most difficult for you.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-medium text-amber-800 mb-2 flex items-center">
          <Lightbulb className="h-4 w-4 mr-2" />
          How I'll help you with {subject}:
        </h4>
        <ul className="space-y-2 text-sm text-amber-700">
          <li className="flex items-start">
            <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            <span>Break down complex topics into digestible segments</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            <span>Provide clear, relatable examples tailored to your level</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            <span>Create custom practice questions to test understanding</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            <span>Suggest targeted study strategies for {subject}</span>
          </li>
        </ul>
      </div>

      <p className="text-sm text-gray-500 mt-4 italic">
        Remember: There are no "silly" questions. Your learning journey is unique, and I'm here to support you every step of the way.
      </p>
    </Card>
  );
};