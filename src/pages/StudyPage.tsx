import React from 'react';
import { Header } from '../components/Header';
import { VideoArea } from '../components/VideoArea';
import { ChatTranscript } from '../components/ChatTranscript';
import { QuickActionButtons } from '../components/QuickActionButtons';
import { ProgressSidebar } from '../components/ProgressSidebar';
import { DifficultySlider } from '../components/DifficultySlider';
import { SocialFeatures } from '../components/SocialFeatures';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';

export const StudyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <div className="flex-1 container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Study Area */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <VideoArea />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <DifficultySlider />
            </div>
            <div className="bg-white rounded-lg shadow-sm">
              <QuickActionButtons />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm h-[400px]">
            <ChatTranscript />
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <ProgressSidebar />
          <SocialFeatures />
        </div>
        
        {/* Analytics Dashboard */}
        <div className="lg:col-span-12">
          <AnalyticsDashboard />
        </div>
      </div>
    </div>
  );
};