import React from 'react';
import { Card } from './Card';
import { cn, commonStyles } from '../styles/utils';
import { BookOpen, Brain, Target, CheckCircle, HelpCircle, Lightbulb, X } from 'lucide-react';
import { Button } from './Button';
import { useStore } from '../store/store';

interface StudyModePromptProps {
  onClose: () => void;
  className?: string;
}

export const StudyModePrompt: React.FC<StudyModePromptProps> = ({
  onClose,
  className
}) => {
  const { currentSubject } = useStore();

  return (
    <Card className={cn("p-6 max-w-2xl mx-auto", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-100 rounded-full">
            <BookOpen className="h-5 w-5 text-amber-600" />
          </div>
          <h3 className={cn(commonStyles.heading.h3)}>
            Study Mode Activated
          </h3>
        </div>
        <Button
          variant="text"
          onClick={onClose}
          className="p-1"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-gray-500" />
        </Button>
      </div>

      <div className="mb-6">
        <p className="text-gray-700 mb-4">
          I'm now your dedicated AI learning companion for {currentSubject}. To get the most out of our study session:
        </p>

        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="p-1.5 bg-blue-100 rounded-full mt-0.5">
              <Brain className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Share specific topics or questions</h4>
              <p className="text-sm text-gray-600">
                The more specific your questions, the more targeted my help can be.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="p-1.5 bg-green-100 rounded-full mt-0.5">
              <Target className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Tell me your learning goals</h4>
              <p className="text-sm text-gray-600">
                Are you preparing for an exam, working on homework, or exploring a new concept?
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="p-1.5 bg-purple-100 rounded-full mt-0.5">
              <HelpCircle className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Mention your current understanding</h4>
              <p className="text-sm text-gray-600">
                Knowing your level helps me tailor explanations appropriately.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-medium text-amber-800 mb-2 flex items-center">
          <Lightbulb className="h-4 w-4 mr-2" />
          How I'll help you with {currentSubject}:
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
            <span>Suggest targeted study strategies for {currentSubject}</span>
          </li>
        </ul>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          variant="primary"
          onClick={onClose}
        >
          Start Learning
        </Button>
      </div>
    </Card>
  );
};