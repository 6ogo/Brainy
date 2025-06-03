import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { cn, commonStyles } from '../styles/utils';
import { useStore } from '../store/store';
import { supabase } from '../lib/supabase';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface StudySession {
  id: string;
  user_id: string;
  subject: string;
  duration: number;
  messages_count: number;
  topics_discussed: string[];
  xp_earned: number;
  created_at: string;
  avatar_used: string;
  learning_mode: string;
}

export const LearningAnalytics: React.FC = () => {
  const { socialStats } = useStore();
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalyticsData() {
      try {
        setLoading(true);
        
        // Fetch study sessions for the current user
        const { data: sessionData, error: sessionError } = await supabase
          .from('public_bolt.study_sessions')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (sessionError) {
          throw new Error(sessionError.message);
        }
        
        setStudySessions(sessionData || []);
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }
    
    fetchAnalyticsData();
  }, []);

  // Calculate total study time in hours
  const totalStudyHours = studySessions.reduce((total, session) => 
    total + (session.duration / 3600), 0).toFixed(1);

  // Calculate total XP earned from study sessions
  const sessionXpEarned = studySessions.reduce((total, session) => 
    total + session.xp_earned, 0);

  // Prepare data for subject distribution chart
  const subjectDistribution = studySessions.reduce((acc, session) => {
    acc[session.subject] = (acc[session.subject] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const subjectChartData = {
    labels: Object.keys(subjectDistribution),
    datasets: [
      {
        label: 'Study Sessions by Subject',
        data: Object.values(subjectDistribution),
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 205, 86, 0.6)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for weekly activity chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  const sessionsByDay = last7Days.reduce((acc, day) => {
    acc[day] = studySessions.filter(session => 
      session.created_at.split('T')[0] === day
    ).length;
    return acc;
  }, {} as Record<string, number>);

  const weeklyActivityData = {
    labels: last7Days.map(day => {
      const date = new Date(day);
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Study Sessions',
        data: Object.values(sessionsByDay),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  // Prepare data for learning mode distribution
  const modeDistribution = studySessions.reduce((acc, session) => {
    acc[session.learning_mode] = (acc[session.learning_mode] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const modeChartData = {
    labels: Object.keys(modeDistribution).map(mode => 
      mode.charAt(0).toUpperCase() + mode.slice(1)
    ),
    datasets: [
      {
        label: 'Sessions by Learning Mode',
        data: Object.values(modeDistribution),
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className={cn(commonStyles.heading.h1, "mb-8")}>
          Learning Analytics
        </h1>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <Card className="p-6 bg-red-50 border border-red-200">
            <p className="text-red-600">{error}</p>
            <p className="mt-2">Try refreshing the page or check your connection.</p>
          </Card>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="p-6">
                <h3 className={cn(commonStyles.heading.h3, "mb-2")}>Total Study Sessions</h3>
                <p className="text-4xl font-bold text-primary-600">{studySessions.length}</p>
              </Card>
              
              <Card className="p-6">
                <h3 className={cn(commonStyles.heading.h3, "mb-2")}>Total Study Hours</h3>
                <p className="text-4xl font-bold text-primary-600">{totalStudyHours}</p>
              </Card>
              
              <Card className="p-6">
                <h3 className={cn(commonStyles.heading.h3, "mb-2")}>Current XP</h3>
                <p className="text-4xl font-bold text-primary-600">{socialStats.totalXP}</p>
                <p className="text-sm text-gray-500">Level {socialStats.level}</p>
                <p className="text-xs text-gray-400 mt-1">Session XP: {sessionXpEarned}</p>
              </Card>
            </div>
            
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Card className="p-6">
                <h3 className={cn(commonStyles.heading.h3, "mb-4")}>Weekly Activity</h3>
                <div className="h-64">
                  <Line 
                    data={weeklyActivityData} 
                    options={{
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            precision: 0
                          }
                        }
                      }
                    }}
                  />
                </div>
              </Card>
              
              <Card className="p-6">
                <h3 className={cn(commonStyles.heading.h3, "mb-4")}>Subject Distribution</h3>
                <div className="h-64">
                  <Doughnut 
                    data={subjectChartData} 
                    options={{
                      maintainAspectRatio: false,
                    }}
                  />
                </div>
              </Card>
            </div>
            
            {/* Additional Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Card className="p-6">
                <h3 className={cn(commonStyles.heading.h3, "mb-4")}>Learning Mode Preference</h3>
                <div className="h-64">
                  <Doughnut 
                    data={modeChartData} 
                    options={{
                      maintainAspectRatio: false,
                    }}
                  />
                </div>
              </Card>
              
              <Card className="p-6">
                <h3 className={cn(commonStyles.heading.h3, "mb-4")}>Study Streak</h3>
                <div className="flex flex-col items-center justify-center h-64">
                  <div className="text-6xl font-bold text-primary-600 mb-2">
                    {socialStats.streak.current}
                  </div>
                  <p className="text-lg">days current streak</p>
                  <p className="mt-4 text-gray-600">Longest streak: {socialStats.streak.longest} days</p>
                </div>
              </Card>
            </div>
            
            {/* Recent Sessions */}
            <Card className="p-6">
              <h3 className={cn(commonStyles.heading.h3, "mb-4")}>Recent Study Sessions</h3>
              
              {studySessions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No study sessions recorded yet. Start learning to see your progress!</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">XP Earned</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {studySessions.slice(0, 5).map((session) => (
                        <tr key={session.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(session.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {session.subject}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {session.avatar_used.split('-').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {session.learning_mode.charAt(0).toUpperCase() + session.learning_mode.slice(1)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {Math.floor(session.duration / 60)} mins
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {session.xp_earned}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
};