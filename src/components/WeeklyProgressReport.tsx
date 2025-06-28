import React from 'react';
import { Card } from './Card';
import { cn, commonStyles } from '../styles/utils';
import { 
  Calendar, 
  Clock, 
  BarChart, 
  Award, 
  BookOpen, 
  Brain,
  CheckCircle,
  Download,
  Share2
} from 'lucide-react';
import { Button } from './Button';
import { format, subDays } from 'date-fns';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import toast from 'react-hot-toast';

interface WeeklyProgressReportProps {
  report: any;
  className?: string;
}

export const WeeklyProgressReport: React.FC<WeeklyProgressReportProps> = ({
  report,
  className
}) => {
  // Generate data for the weekly activity chart
  const generateWeeklyActivityData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(today, 6 - i);
      const dayName = days[date.getDay()];
      
      // Get random minutes for demo purposes
      // In a real app, this would come from the report data
      const minutes = Math.floor(Math.random() * 60) + 10;
      
      return {
        day: dayName,
        minutes,
        date: format(date, 'MMM dd')
      };
    });
  };
  
  const weeklyActivityData = generateWeeklyActivityData();
  
  const handleDownloadReport = () => {
    toast.success('Report downloaded successfully');
  };
  
  const handleShareReport = () => {
    toast.success('Report shared successfully');
  };
  
  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={cn(commonStyles.heading.h3)}>
          Weekly Progress Report
        </h3>
        <div className="text-sm text-gray-500">
          {format(report.weekStartDate, 'MMM dd')} - {format(report.weekEndDate, 'MMM dd, yyyy')}
        </div>
      </div>
      
      {/* Overall Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-900">Overall Progress</h4>
          <span className="text-sm text-gray-600">{report.overallProgress}% complete</span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-primary-500 rounded-full transition-all duration-500"
            style={{ width: `${report.overallProgress}%` }}
          ></div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-700">Study Time</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">{report.weeklyStudyTime} min</p>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <BookOpen className="h-4 w-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-700">Topics Completed</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {report.learningPaths.reduce((sum: number, path: any) => sum + path.topicsCompleted, 0)}
            </p>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Brain className="h-4 w-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-700">Learning Style</span>
            </div>
            <p className="text-lg font-semibold text-gray-900 capitalize">{report.learningStyle}</p>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-700">Consistency</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">{report.consistencyRating}</p>
          </div>
        </div>
      </div>
      
      {/* Weekly Activity Chart */}
      <div className="mb-8">
        <h4 className="font-medium text-gray-900 mb-4">Weekly Activity</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={weeklyActivityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`${value} minutes`, 'Study Time']}
                labelFormatter={(label: string, payload: any) => {
                  if (payload && payload.length > 0) {
                    return payload[0].payload.date;
                  }
                  return label;
                }}
              />
              <Bar dataKey="minutes" fill="#3B82F6">
                {weeklyActivityData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === weeklyActivityData.length - 1 ? '#2563EB' : '#3B82F6'} 
                  />
                ))}
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Learning Paths Progress */}
      <div className="mb-8">
        <h4 className="font-medium text-gray-900 mb-4">Learning Paths Progress</h4>
        
        {report.learningPaths.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <BookOpen className="h-10 w-10 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No active learning paths</p>
          </div>
        ) : (
          <div className="space-y-4">
            {report.learningPaths.map((path: any, index: number) => (
              <div key={index} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h5 className="font-medium text-gray-900">{path.subject}</h5>
                    <p className="text-sm text-gray-500">{path.difficultyLevel}</p>
                  </div>
                  <span className="text-sm text-gray-600">{path.completionRate}% complete</span>
                </div>
                
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                  <div 
                    className="h-full bg-primary-500 rounded-full"
                    style={{ width: `${path.completionRate}%` }}
                  ></div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-green-50 rounded text-center">
                    <div className="font-medium text-green-800">{path.topicsCompleted}</div>
                    <div className="text-green-600">Completed</div>
                  </div>
                  
                  <div className="p-2 bg-blue-50 rounded text-center">
                    <div className="font-medium text-blue-800">{path.topicsInProgress}</div>
                    <div className="text-blue-600">In Progress</div>
                  </div>
                  
                  <div className="p-2 bg-amber-50 rounded text-center">
                    <div className="font-medium text-amber-800">{path.topicsStruggling}</div>
                    <div className="text-amber-600">Struggling</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Recommendations */}
      <div className="mb-8">
        <h4 className="font-medium text-gray-900 mb-4">Personalized Recommendations</h4>
        
        <div className="p-4 bg-primary-50 border border-primary-100 rounded-lg">
          <ul className="space-y-3">
            {report.recommendations.map((recommendation: string, index: number) => (
              <li key={index} className="flex items-start">
                <CheckCircle className="h-5 w-5 text-primary-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-primary-700">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          leftIcon={<Download className="h-4 w-4" />}
          onClick={handleDownloadReport}
          className="flex-1"
        >
          Download Report
        </Button>
        
        <Button
          variant="outline"
          leftIcon={<Share2 className="h-4 w-4" />}
          onClick={handleShareReport}
          className="flex-1"
        >
          Share Report
        </Button>
      </div>
    </Card>
  );
};

export default WeeklyProgressReport;