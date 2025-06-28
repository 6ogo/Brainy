import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { cn, commonStyles } from '../styles/utils';
import { 
  Brain, 
  Clock, 
  BarChart, 
  Filter, 
  Download, 
  AlertCircle, 
  Loader,
  Zap,
  Database,
  MessageSquare,
  RefreshCw,
  CheckCircle,
  XCircle,
  Layers,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { Button } from './Button';
import { useAuth } from '../contexts/AuthContext';
import { 
  AreaChart, 
  Area, 
  BarChart as RechartsBarChart, 
  Bar, 
  LineChart, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { getContextAnalyticsData } from '../services/contextAnalyticsService';
import toast from 'react-hot-toast';

interface ContextAnalyticsDashboardProps {
  className?: string;
}

export const ContextAnalyticsDashboard: React.FC<ContextAnalyticsDashboardProps> = ({
  className
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'all'>('week');
  const [conversationType, setConversationType] = useState<'all' | 'text' | 'voice' | 'video'>('all');
  const [contextComplexity, setContextComplexity] = useState<'all' | 'simple' | 'moderate' | 'complex'>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'retention' | 'memory' | 'relevance'>('overview');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user) {
      loadAnalyticsData();
    }
  }, [user, timeframe, conversationType, contextComplexity]);

  const loadAnalyticsData = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await getContextAnalyticsData(
        user.id, 
        timeframe, 
        conversationType, 
        contextComplexity
      );
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error loading context analytics:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = () => {
    if (!analyticsData) return;
    
    try {
      // Create a JSON blob and download it
      const dataStr = JSON.stringify(analyticsData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `context-analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Analytics data exported successfully');
    } catch (err) {
      console.error('Error exporting data:', err);
      toast.error('Failed to export analytics data');
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (loading) {
    return (
      <Card className={cn("p-6 flex flex-col items-center justify-center min-h-[400px]", className)}>
        <Loader className="h-12 w-12 text-primary-500 animate-spin mb-4" />
        <p className="text-gray-600">Loading context analytics data...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4 text-center">{error}</p>
          <Button variant="primary" onClick={loadAnalyticsData}>
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (!analyticsData) {
    return (
      <Card className={cn("p-6 text-center", className)}>
        <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Context Analytics Data Available
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Start more conversations to generate context analytics data. This dashboard will show insights about how well context is maintained across your interactions.
        </p>
        <Button
          variant="primary"
          onClick={() => window.location.href = '/study'}
        >
          Start Learning
        </Button>
      </Card>
    );
  }

  return (
    <Card className={cn("p-6", className)}>
      {/* Header with tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className={cn(commonStyles.heading.h3)}>
            Context Management Analytics
          </h3>
          <p className="text-gray-600">
            Track how well context is maintained across your conversations
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Filter className="h-4 w-4" />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filter
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={loadAnalyticsData}
          >
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={handleExportData}
          >
            Export
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Period
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as any)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="day">Last 24 Hours</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Conversation Type
              </label>
              <select
                value={conversationType}
                onChange={(e) => setConversationType(e.target.value as any)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="all">All Types</option>
                <option value="text">Text Only</option>
                <option value="voice">Voice</option>
                <option value="video">Video</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Context Complexity
              </label>
              <select
                value={contextComplexity}
                onChange={(e) => setContextComplexity(e.target.value as any)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="all">All Complexity Levels</option>
                <option value="simple">Simple</option>
                <option value="moderate">Moderate</option>
                <option value="complex">Complex</option>
              </select>
            </div>
          </div>
        </div>
      )}
      
      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6 overflow-x-auto">
        <button
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
            activeTab === 'overview' 
              ? "bg-white shadow-sm text-primary-700" 
              : "text-gray-600 hover:text-gray-900"
          )}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
            activeTab === 'retention' 
              ? "bg-white shadow-sm text-primary-700" 
              : "text-gray-600 hover:text-gray-900"
          )}
          onClick={() => setActiveTab('retention')}
        >
          Context Retention
        </button>
        <button
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
            activeTab === 'memory' 
              ? "bg-white shadow-sm text-primary-700" 
              : "text-gray-600 hover:text-gray-900"
          )}
          onClick={() => setActiveTab('memory')}
        >
          Memory Usage
        </button>
        <button
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
            activeTab === 'relevance' 
              ? "bg-white shadow-sm text-primary-700" 
              : "text-gray-600 hover:text-gray-900"
          )}
          onClick={() => setActiveTab('relevance')}
        >
          Response Relevance
        </button>
      </div>
      
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Context Retention</p>
                  <p className="text-xl font-semibold">{analyticsData.overview.contextRetentionScore}%</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg text-green-600">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Response Relevance</p>
                  <p className="text-xl font-semibold">{analyticsData.overview.responseRelevanceScore}%</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Memory Efficiency</p>
                  <p className="text-xl font-semibold">{analyticsData.overview.memoryEfficiencyScore}%</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Context Switches</p>
                  <p className="text-xl font-semibold">{analyticsData.overview.contextSwitchCount}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Context Retention Over Time */}
          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Context Retention Over Time</h4>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.retentionOverTime}>
                  <defs>
                    <linearGradient id="colorRetention" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Retention']} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="retention" 
                    stroke="#3B82F6" 
                    fillOpacity={1} 
                    fill="url(#colorRetention)" 
                    name="Context Retention"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Context Metrics by Type */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Context Metrics by Conversation Type</h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analyticsData.metricsByConversationType}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="type" type="category" width={80} />
                    <Tooltip formatter={(value) => [`${value}%`, '']} />
                    <Legend />
                    <Bar dataKey="retention" name="Retention" fill="#3B82F6" />
                    <Bar dataKey="relevance" name="Relevance" fill="#10B981" />
                    <Bar dataKey="efficiency" name="Efficiency" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Context Metrics by Complexity</h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart outerRadius={90} data={analyticsData.metricsByComplexity}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Radar
                      name="Simple"
                      dataKey="simple"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.5}
                    />
                    <Radar
                      name="Moderate"
                      dataKey="moderate"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.5}
                    />
                    <Radar
                      name="Complex"
                      dataKey="complex"
                      stroke="#8B5CF6"
                      fill="#8B5CF6"
                      fillOpacity={0.5}
                    />
                    <Legend />
                    <Tooltip formatter={(value) => [`${value}%`, '']} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Context Degradation Analysis */}
          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Context Degradation Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-medium text-gray-800 mb-3">Degradation by Message Count</h5>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData.degradationByMessageCount}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="messageCount" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Retention']} />
                      <Line 
                        type="monotone" 
                        dataKey="retention" 
                        stroke="#3B82F6" 
                        name="Context Retention"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-800 mb-3">Degradation by Time</h5>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData.degradationByTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timeMinutes" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Retention']} />
                      <Line 
                        type="monotone" 
                        dataKey="retention" 
                        stroke="#8B5CF6" 
                        name="Context Retention"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
          
          {/* Context Issues and Insights */}
          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Context Issues and Insights</h4>
            
            <div className="space-y-4">
              {analyticsData.contextIssues.map((issue: any, index: number) => (
                <div key={index} className={cn(
                  "p-3 rounded-lg border",
                  issue.severity === 'high' ? "bg-red-50 border-red-200" :
                  issue.severity === 'medium' ? "bg-amber-50 border-amber-200" :
                  "bg-blue-50 border-blue-200"
                )}>
                  <div className="flex items-start space-x-3">
                    <div className={cn(
                      "p-1.5 rounded-full mt-0.5",
                      issue.severity === 'high' ? "bg-red-100" :
                      issue.severity === 'medium' ? "bg-amber-100" :
                      "bg-blue-100"
                    )}>
                      {issue.severity === 'high' ? (
                        <XCircle className="h-4 w-4 text-red-600" />
                      ) : issue.severity === 'medium' ? (
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    
                    <div>
                      <h5 className={cn(
                        "font-medium",
                        issue.severity === 'high' ? "text-red-800" :
                        issue.severity === 'medium' ? "text-amber-800" :
                        "text-blue-800"
                      )}>
                        {issue.title}
                      </h5>
                      <p className={cn(
                        "text-sm",
                        issue.severity === 'high' ? "text-red-700" :
                        issue.severity === 'medium' ? "text-amber-700" :
                        "text-blue-700"
                      )}>
                        {issue.description}
                      </p>
                      
                      {issue.recommendation && (
                        <p className={cn(
                          "text-sm mt-1 font-medium",
                          issue.severity === 'high' ? "text-red-700" :
                          issue.severity === 'medium' ? "text-amber-700" :
                          "text-blue-700"
                        )}>
                          Recommendation: {issue.recommendation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Context Retention Tab */}
      {activeTab === 'retention' && (
        <div className="space-y-6">
          {/* Retention Score Card */}
          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-1">Context Retention Score</h4>
                <p className="text-gray-600 mb-4 md:mb-0">
                  How well context is maintained across conversations
                </p>
              </div>
              
              <div className="flex items-center">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="10"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke={
                        analyticsData.contextRetention.overallScore >= 80 ? "#10B981" :
                        analyticsData.contextRetention.overallScore >= 60 ? "#3B82F6" :
                        "#F59E0B"
                      }
                      strokeWidth="10"
                      strokeDasharray={`${2 * Math.PI * 45 * analyticsData.contextRetention.overallScore / 100} ${2 * Math.PI * 45 * (1 - analyticsData.contextRetention.overallScore / 100)}`}
                      strokeDashoffset={2 * Math.PI * 45 * 0.25}
                      transform="rotate(-90 50 50)"
                    />
                    {/* Text */}
                    <text
                      x="50"
                      y="50"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="20"
                      fontWeight="bold"
                      fill={
                        analyticsData.contextRetention.overallScore >= 80 ? "#10B981" :
                        analyticsData.contextRetention.overallScore >= 60 ? "#3B82F6" :
                        "#F59E0B"
                      }
                    >
                      {analyticsData.contextRetention.overallScore}%
                    </text>
                  </svg>
                </div>
                
                <div className="ml-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Short-term (5 min)</span>
                      <span className="text-sm font-medium">{analyticsData.contextRetention.shortTermScore}%</span>
                    </div>
                    <div className="w-40 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${analyticsData.contextRetention.shortTermScore}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Medium-term (1 hr)</span>
                      <span className="text-sm font-medium">{analyticsData.contextRetention.mediumTermScore}%</span>
                    </div>
                    <div className="w-40 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${analyticsData.contextRetention.mediumTermScore}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Long-term (1 day+)</span>
                      <span className="text-sm font-medium">{analyticsData.contextRetention.longTermScore}%</span>
                    </div>
                    <div className="w-40 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${analyticsData.contextRetention.longTermScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Context Switching Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Context Switching Patterns</h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.contextRetention.switchingPatterns}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}`, 'Switches']} />
                    <Legend />
                    <Bar dataKey="count" name="Context Switches" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Context Accuracy by Topic</h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analyticsData.contextRetention.accuracyByTopic}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="topic" type="category" width={100} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Accuracy']} />
                    <Bar 
                      dataKey="accuracy" 
                      name="Context Accuracy" 
                      fill="#10B981"
                      label={{ position: 'right', formatter: (value: number) => `${value}%` }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Context Retention Factors */}
          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Context Retention Factors</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-medium text-gray-800 mb-3">Factors Affecting Retention</h5>
                <div className="space-y-3">
                  {analyticsData.contextRetention.factors.map((factor: any, index: number) => (
                    <div key={index}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">{factor.name}</span>
                        <span className="text-sm font-medium">{factor.impact}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full",
                            factor.impact >= 80 ? "bg-green-500" :
                            factor.impact >= 50 ? "bg-blue-500" :
                            factor.impact >= 30 ? "bg-amber-500" :
                            "bg-red-500"
                          )}
                          style={{ width: `${factor.impact}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-800 mb-3">Retention by Context Type</h5>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.contextRetention.retentionByType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="type"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {analyticsData.contextRetention.retentionByType.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
          
          {/* Context Loss Patterns */}
          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Context Loss Patterns</h4>
            
            <div className="space-y-4">
              {analyticsData.contextRetention.lossPatterns.map((pattern: any, index: number) => (
                <div key={index} className={cn(
                  "p-3 rounded-lg border",
                  pattern.severity === 'high' ? "bg-red-50 border-red-200" :
                  pattern.severity === 'medium' ? "bg-amber-50 border-amber-200" :
                  "bg-blue-50 border-blue-200"
                )}>
                  <div className="flex items-start space-x-3">
                    <div className={cn(
                      "p-1.5 rounded-full mt-0.5",
                      pattern.severity === 'high' ? "bg-red-100" :
                      pattern.severity === 'medium' ? "bg-amber-100" :
                      "bg-blue-100"
                    )}>
                      {pattern.severity === 'high' ? (
                        <XCircle className="h-4 w-4 text-red-600" />
                      ) : pattern.severity === 'medium' ? (
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    
                    <div>
                      <h5 className={cn(
                        "font-medium",
                        pattern.severity === 'high' ? "text-red-800" :
                        pattern.severity === 'medium' ? "text-amber-800" :
                        "text-blue-800"
                      )}>
                        {pattern.pattern}
                      </h5>
                      <p className={cn(
                        "text-sm",
                        pattern.severity === 'high' ? "text-red-700" :
                        pattern.severity === 'medium' ? "text-amber-700" :
                        "text-blue-700"
                      )}>
                        {pattern.description}
                      </p>
                      
                      {pattern.recommendation && (
                        <p className={cn(
                          "text-sm mt-1 font-medium",
                          pattern.severity === 'high' ? "text-red-700" :
                          pattern.severity === 'medium' ? "text-amber-700" :
                          "text-blue-700"
                        )}>
                          Recommendation: {pattern.recommendation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Memory Usage Tab */}
      {activeTab === 'memory' && (
        <div className="space-y-6">
          {/* Memory Usage Overview */}
          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-1">Memory Usage Efficiency</h4>
                <p className="text-gray-600 mb-4 md:mb-0">
                  How efficiently context memory is being utilized
                </p>
              </div>
              
              <div className="flex items-center">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="10"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke={
                        analyticsData.memoryUsage.efficiencyScore >= 80 ? "#10B981" :
                        analyticsData.memoryUsage.efficiencyScore >= 60 ? "#3B82F6" :
                        "#F59E0B"
                      }
                      strokeWidth="10"
                      strokeDasharray={`${2 * Math.PI * 45 * analyticsData.memoryUsage.efficiencyScore / 100} ${2 * Math.PI * 45 * (1 - analyticsData.memoryUsage.efficiencyScore / 100)}`}
                      strokeDashoffset={2 * Math.PI * 45 * 0.25}
                      transform="rotate(-90 50 50)"
                    />
                    {/* Text */}
                    <text
                      x="50"
                      y="50"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="20"
                      fontWeight="bold"
                      fill={
                        analyticsData.memoryUsage.efficiencyScore >= 80 ? "#10B981" :
                        analyticsData.memoryUsage.efficiencyScore >= 60 ? "#3B82F6" :
                        "#F59E0B"
                      }
                    >
                      {analyticsData.memoryUsage.efficiencyScore}%
                    </text>
                  </svg>
                </div>
                
                <div className="ml-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Memory Utilization</span>
                      <span className="text-sm font-medium">{analyticsData.memoryUsage.utilizationRate}%</span>
                    </div>
                    <div className="w-40 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${analyticsData.memoryUsage.utilizationRate}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Context Length</span>
                      <span className="text-sm font-medium">{analyticsData.memoryUsage.averageContextLength} tokens</span>
                    </div>
                    <div className="w-40 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${(analyticsData.memoryUsage.averageContextLength / analyticsData.memoryUsage.maxContextLength) * 100}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Compression Rate</span>
                      <span className="text-sm font-medium">{analyticsData.memoryUsage.compressionRate}x</span>
                    </div>
                    <div className="w-40 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${Math.min(100, analyticsData.memoryUsage.compressionRate * 20)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Memory Usage Over Time */}
          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Memory Usage Over Time</h4>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData.memoryUsage.usageOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="contextLength" 
                    stroke="#3B82F6" 
                    name="Context Length (tokens)"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="memoryUsage" 
                    stroke="#8B5CF6" 
                    name="Memory Usage (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Context Length Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Context Length Distribution</h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.memoryUsage.contextLengthDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}`, 'Conversations']} />
                    <Bar dataKey="count" name="Conversations" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Memory Optimization Techniques</h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.memoryUsage.optimizationTechniques}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="percentage"
                      nameKey="technique"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {analyticsData.memoryUsage.optimizationTechniques.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Usage']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Memory Efficiency Insights */}
          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Memory Efficiency Insights</h4>
            
            <div className="space-y-4">
              {analyticsData.memoryUsage.efficiencyInsights.map((insight: any, index: number) => (
                <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="p-1.5 bg-blue-100 rounded-full mt-0.5">
                      <Layers className="h-4 w-4 text-blue-600" />
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-blue-800">{insight.title}</h5>
                      <p className="text-sm text-blue-700">{insight.description}</p>
                      
                      {insight.metrics && (
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {Object.entries(insight.metrics).map(([key, value]: [string, any]) => (
                            <div key={key} className="p-2 bg-blue-100 rounded">
                              <p className="text-xs text-blue-800 font-medium">{key}</p>
                              <p className="text-sm text-blue-900 font-semibold">{value}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Response Relevance Tab */}
      {activeTab === 'relevance' && (
        <div className="space-y-6">
          {/* Relevance Score Card */}
          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-1">Response Relevance Score</h4>
                <p className="text-gray-600 mb-4 md:mb-0">
                  How relevant AI responses are to the conversation context
                </p>
              </div>
              
              <div className="flex items-center">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="10"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke={
                        analyticsData.responseRelevance.overallScore >= 80 ? "#10B981" :
                        analyticsData.responseRelevance.overallScore >= 60 ? "#3B82F6" :
                        "#F59E0B"
                      }
                      strokeWidth="10"
                      strokeDasharray={`${2 * Math.PI * 45 * analyticsData.responseRelevance.overallScore / 100} ${2 * Math.PI * 45 * (1 - analyticsData.responseRelevance.overallScore / 100)}`}
                      strokeDashoffset={2 * Math.PI * 45 * 0.25}
                      transform="rotate(-90 50 50)"
                    />
                    {/* Text */}
                    <text
                      x="50"
                      y="50"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="20"
                      fontWeight="bold"
                      fill={
                        analyticsData.responseRelevance.overallScore >= 80 ? "#10B981" :
                        analyticsData.responseRelevance.overallScore >= 60 ? "#3B82F6" :
                        "#F59E0B"
                      }
                    >
                      {analyticsData.responseRelevance.overallScore}%
                    </text>
                  </svg>
                </div>
                
                <div className="ml-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Contextual Relevance</span>
                      <span className="text-sm font-medium">{analyticsData.responseRelevance.contextualRelevance}%</span>
                    </div>
                    <div className="w-40 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${analyticsData.responseRelevance.contextualRelevance}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Response Coherence</span>
                      <span className="text-sm font-medium">{analyticsData.responseRelevance.responseCoherence}%</span>
                    </div>
                    <div className="w-40 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${analyticsData.responseRelevance.responseCoherence}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Topic Consistency</span>
                      <span className="text-sm font-medium">{analyticsData.responseRelevance.topicConsistency}%</span>
                    </div>
                    <div className="w-40 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${analyticsData.responseRelevance.topicConsistency}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Relevance Over Time */}
          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Relevance Scores Over Time</h4>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData.responseRelevance.relevanceOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, '']} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="contextualRelevance" 
                    stroke="#10B981" 
                    name="Contextual Relevance"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="responseCoherence" 
                    stroke="#3B82F6" 
                    name="Response Coherence"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="topicConsistency" 
                    stroke="#8B5CF6" 
                    name="Topic Consistency"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Relevance by Context Type */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Relevance by Context Type</h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analyticsData.responseRelevance.relevanceByContextType}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="type" type="category" width={100} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Relevance']} />
                    <Bar 
                      dataKey="score" 
                      name="Relevance Score" 
                      fill="#10B981"
                      label={{ position: 'right', formatter: (value: number) => `${value}%` }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Relevance by Conversation Length</h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.responseRelevance.relevanceByConversationLength}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="messageCount" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Relevance']} />
                    <Line 
                      type="monotone" 
                      dataKey="relevanceScore" 
                      stroke="#3B82F6" 
                      name="Relevance Score"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Relevance Issues */}
          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Relevance Issues</h4>
            
            <div className="space-y-4">
              {analyticsData.responseRelevance.relevanceIssues.map((issue: any, index: number) => (
                <div key={index} className={cn(
                  "p-3 rounded-lg border",
                  issue.severity === 'high' ? "bg-red-50 border-red-200" :
                  issue.severity === 'medium' ? "bg-amber-50 border-amber-200" :
                  "bg-blue-50 border-blue-200"
                )}>
                  <div className="flex items-start space-x-3">
                    <div className={cn(
                      "p-1.5 rounded-full mt-0.5",
                      issue.severity === 'high' ? "bg-red-100" :
                      issue.severity === 'medium' ? "bg-amber-100" :
                      "bg-blue-100"
                    )}>
                      {issue.severity === 'high' ? (
                        <XCircle className="h-4 w-4 text-red-600" />
                      ) : issue.severity === 'medium' ? (
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    
                    <div>
                      <h5 className={cn(
                        "font-medium",
                        issue.severity === 'high' ? "text-red-800" :
                        issue.severity === 'medium' ? "text-amber-800" :
                        "text-blue-800"
                      )}>
                        {issue.issue}
                      </h5>
                      <p className={cn(
                        "text-sm",
                        issue.severity === 'high' ? "text-red-700" :
                        issue.severity === 'medium' ? "text-amber-700" :
                        "text-blue-700"
                      )}>
                        {issue.description}
                      </p>
                      
                      {issue.frequency && (
                        <p className={cn(
                          "text-sm mt-1",
                          issue.severity === 'high' ? "text-red-700" :
                          issue.severity === 'medium' ? "text-amber-700" :
                          "text-blue-700"
                        )}>
                          Frequency: {issue.frequency}
                        </p>
                      )}
                      
                      {issue.recommendation && (
                        <p className={cn(
                          "text-sm mt-1 font-medium",
                          issue.severity === 'high' ? "text-red-700" :
                          issue.severity === 'medium' ? "text-amber-700" :
                          "text-blue-700"
                        )}>
                          Recommendation: {issue.recommendation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Improvement Strategies */}
          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Improvement Strategies</h4>
              <Button
                variant="outline"
                size="sm"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                View All Strategies
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analyticsData.responseRelevance.improvementStrategies.slice(0, 4).map((strategy: any, index: number) => (
                <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="p-1.5 bg-green-100 rounded-full mt-0.5">
                      <Zap className="h-4 w-4 text-green-600" />
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-green-800">{strategy.title}</h5>
                      <p className="text-sm text-green-700">{strategy.description}</p>
                      
                      {strategy.expectedImprovement && (
                        <p className="text-sm text-green-700 mt-1 font-medium">
                          Expected improvement: {strategy.expectedImprovement}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ContextAnalyticsDashboard;