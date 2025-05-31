import React, { useState } from 'react';
import { useStore } from '../store/store';
import { format } from 'date-fns';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { 
  Brain, Clock, Target, TrendingUp, Download,
  Calendar, Award, BookOpen, ChevronDown
} from 'lucide-react';
import { jsPDF } from 'jspdf';

const subjects = ['Math', 'Science', 'English', 'History', 'Languages'];
const skills = ['Problem Solving', 'Critical Thinking', 'Memory', 'Speed', 'Comprehension'];

export const AnalyticsDashboard: React.FC = () => {
  const { sessionStats, messages, socialStats, currentSubject } = useStore();
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [showExport, setShowExport] = useState(false);

  // Sample data - in production, this would come from backend
  const learningData = Array.from({ length: 7 }, (_, i) => ({
    day: format(new Date(Date.now() - i * 24 * 60 * 60 * 1000), 'EEE'),
    progress: Math.floor(Math.random() * 100),
    retention: Math.floor(Math.random() * 100),
  })).reverse();

  const subjectProgress = subjects.map(subject => ({
    subject,
    progress: Math.floor(Math.random() * 100),
  }));

  const skillsData = skills.map(skill => ({
    skill,
    value: Math.floor(Math.random() * 100),
  }));

  const studyPatterns = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    efficiency: Math.floor(Math.random() * 100),
  }));

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Learning Analytics Report', 20, 20);
    
    doc.setFontSize(14);
    doc.text(`Generated on ${format(new Date(), 'PPP')}`, 20, 30);
    doc.text(`Student Progress Report - ${currentSubject}`, 20, 40);
    
    doc.setFontSize(12);
    doc.text(`Total XP: ${socialStats.totalXP}`, 20, 60);
    doc.text(`Current Streak: ${socialStats.streak.current} days`, 20, 70);
    doc.text(`Study Time: ${sessionStats.duration} minutes`, 20, 80);
    
    doc.save('learning-analytics.pdf');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Learning Analytics</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              onClick={() => setSelectedTimeframe(prev => prev === 'week' ? 'month' : 'week')}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
            >
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium capitalize">{selectedTimeframe}</span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowExport(!showExport)}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Export</span>
            </button>
            
            {showExport && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                <button
                  onClick={exportToPDF}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Download PDF Report
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-primary-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-full">
              <Brain className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-primary-600">Concepts Mastered</p>
              <p className="text-2xl font-semibold text-primary-700">
                {Math.floor(socialStats.totalXP / 100)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-full">
              <Clock className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-600">Study Time</p>
              <p className="text-2xl font-semibold text-green-700">
                {Math.floor(sessionStats.duration / 60)}h {sessionStats.duration % 60}m
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-full">
              <Target className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-purple-600">Accuracy Rate</p>
              <p className="text-2xl font-semibold text-purple-700">
                {Math.floor((messages.filter(m => m.sender === 'user').length / messages.length) * 100)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-full">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-orange-600">Learning Velocity</p>
              <p className="text-2xl font-semibold text-orange-700">
                {(socialStats.totalXP / (sessionStats.duration || 1)).toFixed(1)} XP/min
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Progress Chart */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Learning Progress</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={learningData}>
              <defs>
                <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="progress"
                stroke="#3B82F6"
                fillOpacity={1}
                fill="url(#progressGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subject Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Subject Mastery</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="progress" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Skills Analysis</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={skillsData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="skill" />
                <PolarRadiusAxis />
                <Radar
                  name="Skills"
                  dataKey="value"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Study Patterns */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Study Patterns</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={studyPatterns}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="hour"
                tickFormatter={(hour) => `${hour}:00`}
              />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="efficiency"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};