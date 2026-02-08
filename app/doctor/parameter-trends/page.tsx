'use client'
import { useState, useEffect, useMemo } from 'react';
import { useDecryptedProfile } from '@/hooks/use-centralized-profile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Search, 
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  LineChart,
  ArrowLeft,
  RefreshCw,
  Download
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import CdLoader from '@/components/ui/custom/cd-loader';
import EmptyState from '@/components/ui/EmptyState';

interface ParameterValue {
  id: number;
  parameter: string;
  value: string;
  unit: string;
  normalRange: string;
  isAbnormal: boolean;
  severity: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  reportDate: string;
  labBookingId: number;
  sourceReportId?: number;
  reportSource?: string;
}

interface TrendData {
  parameter: string;
  values: ParameterValue[];
  trend: 'IMPROVING' | 'STABLE' | 'WORSENING';
  changePercent: number;
  latestValue: string;
  latestDate: string;
  normalRange: string;
  unit: string;
  isAbnormal: boolean;
  severity: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
}

export default function DoctorParameterTrendsPage() {
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAbnormal, setFilterAbnormal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'parameter' | 'trend' | 'severity' | 'date'>('parameter');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { profile } = useDecryptedProfile();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientIdParam = searchParams.get('patientId');

  // Use patientId from URL if available (for doctor access), otherwise use profile.id
  const targetPatientId = patientIdParam ? parseInt(patientIdParam) : profile?.id;

  useEffect(() => {
    if (targetPatientId) {
      fetchParameterTrends();
    }
  }, [targetPatientId]);

  const fetchParameterTrends = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/patient/${targetPatientId}/parameter-trends`);
      if (response.ok) {
        const data = await response.json();
        setTrends(data.trends || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch parameter trends",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching parameter trends:', error);
      toast({
        title: "Error",
        description: "Failed to fetch parameter trends",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getParameterCategory = (parameter: string): string => {
    const param = parameter.toLowerCase();
    if (param.includes('hemoglobin') || param.includes('rbc') || param.includes('wbc') || param.includes('platelet')) {
      return 'Blood Count';
    }
    if (param.includes('hba1c') || param.includes('glucose') || param.includes('sugar') || param.includes('insulin')) {
      return 'Diabetes';
    }
    if (param.includes('cholesterol') || param.includes('triglyceride') || param.includes('hdl') || param.includes('ldl')) {
      return 'Lipid Profile';
    }
    if (param.includes('creatinine') || param.includes('urea') || param.includes('bun') || param.includes('gfr')) {
      return 'Kidney Function';
    }
    if (param.includes('tsh') || param.includes('t3') || param.includes('t4') || param.includes('thyroid')) {
      return 'Thyroid';
    }
    if (param.includes('vitamin') || param.includes('calcium') || param.includes('phosphorus')) {
      return 'Vitamins & Minerals';
    }
    if (param.includes('alt') || param.includes('ast') || param.includes('bilirubin') || param.includes('liver')) {
      return 'Liver Function';
    }
    return 'General';
  };

  // Get unique categories from trends
  const categories = useMemo(() => {
    const cats = new Set<string>();
    trends.forEach(trend => {
      // Extract category from parameter name or use 'General'
      const category = getParameterCategory(trend.parameter);
      cats.add(category);
    });
    return Array.from(cats).sort();
  }, [trends]);

  const filteredAndSortedTrends = useMemo(() => {
    let filtered = trends;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(trend => 
        trend.parameter.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by abnormal values
    if (filterAbnormal) {
      filtered = filtered.filter(trend => trend.isAbnormal);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(trend => 
        getParameterCategory(trend.parameter) === selectedCategory
      );
    }

    // Sort trends
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'parameter':
          return a.parameter.localeCompare(b.parameter);
        case 'trend':
          const trendOrder = { 'IMPROVING': 0, 'STABLE': 1, 'WORSENING': 2 };
          return trendOrder[a.trend] - trendOrder[b.trend];
        case 'severity':
          const severityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'NORMAL': 2, 'LOW': 3 };
          return severityOrder[a.severity] - severityOrder[b.severity];
        case 'date':
          return new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [trends, searchTerm, filterAbnormal, selectedCategory, sortBy]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'IMPROVING':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      case 'WORSENING':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'LOW':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const formatChartData = (values: ParameterValue[]) => {
    return values
      .sort((a, b) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime())
      .map((value, index) => ({
        date: new Date(value.reportDate).toLocaleDateString('en-GB', { 
          day: '2-digit', 
          month: 'short', 
          year: '2-digit' 
        }),
        value: parseFloat(value.value) || 0,
        unit: value.unit,
        isAbnormal: value.isAbnormal,
        severity: value.severity,
        fullDate: new Date(value.reportDate).toLocaleDateString('en-GB', { 
          day: '2-digit', 
          month: 'short', 
          year: '2-digit' 
        }),
        reportSource: value.reportSource || 'Unknown Report'
      }));
  };

  const parseNormalRange = (normalRange: string) => {
    const match = normalRange.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
    if (match) {
      return {
        min: parseFloat(match[1]),
        max: parseFloat(match[2])
      };
    }
    return null;
  };

  const renderParameterCard = (trend: TrendData) => {
    const chartData = formatChartData(trend.values);
    const normalRange = parseNormalRange(trend.normalRange);
    
    return (
      <Card key={trend.parameter} className="mb-6 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">{trend.parameter}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={getSeverityColor(trend.severity)}>
                {trend.severity}
              </Badge>
              {getTrendIcon(trend.trend)}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Latest: {trend.latestValue} {trend.unit}
            </span>
            {trend.normalRange && <span>Range: {trend.normalRange}</span>}
            <span className={`font-medium ${trend.changePercent > 0 ? 'text-red-600' : trend.changePercent < 0 ? 'text-green-600' : 'text-gray-600'}`}>
              Change: {trend.changePercent > 0 ? '+' : ''}{trend.changePercent.toFixed(1)}%
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fill: '#666' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#666' }}
                  label={{ value: trend.unit, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#666' } }}
                />
                <Tooltip 
                  formatter={(value: any, name: string, props: any) => [
                    `${value} ${props.payload.unit}`,
                    'Value'
                  ]}
                  labelFormatter={(label: string, payload: any) => {
                    if (payload && payload[0]) {
                      return `${payload[0].payload.reportSource} on ${payload[0].payload.fullDate}`;
                    }
                    return label;
                  }}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                {normalRange && (
                  <>
                    <ReferenceLine 
                      y={normalRange.min} 
                      stroke="#10b981" 
                      strokeDasharray="5 5" 
                      label={{ value: "Normal Min", position: "top", style: { fill: '#10b981', fontSize: '12px' } }}
                    />
                    <ReferenceLine 
                      y={normalRange.max} 
                      stroke="#10b981" 
                      strokeDasharray="5 5" 
                      label={{ value: "Normal Max", position: "top", style: { fill: '#10b981', fontSize: '12px' } }}
                    />
                  </>
                )}
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#3b82f6' }}
                  activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="px-8 py-6">
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Parameter Trends</h1>
            <p className="text-gray-600 mt-1">Track patient lab parameters over time</p>
          </div>
          <CdLoader height="60vh" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/doctor/patients/${patientIdParam}`} className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Parameter Trends</h1>
                <p className="text-gray-600 mt-1">Track patient lab parameters over time</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchParameterTrends}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-6">
        {/* Only show filters and stats when there are parameters */}
        {trends.length > 0 ? (
          <>
            {/* Filters and Controls */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search parameters..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="parameter">Sort by Parameter</option>
                  <option value="trend">Sort by Trend</option>
                  <option value="severity">Sort by Severity</option>
                  <option value="date">Sort by Date</option>
                </select>
                <div className="flex items-center gap-2">
                  <Button
                    variant={filterAbnormal ? "default" : "outline"}
                    onClick={() => setFilterAbnormal(!filterAbnormal)}
                    size="sm"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Abnormal Only
                  </Button>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-white border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <LineChart className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Parameters</p>
                      <p className="text-2xl font-bold text-gray-900">{trends.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Abnormal</p>
                      <p className="text-2xl font-bold text-gray-900">{trends.filter(t => t.isAbnormal).length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Worsening</p>
                      <p className="text-2xl font-bold text-gray-900">{trends.filter(t => t.trend === 'WORSENING').length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingDown className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Improving</p>
                      <p className="text-2xl font-bold text-gray-900">{trends.filter(t => t.trend === 'IMPROVING').length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Parameter Cards */}
            {filteredAndSortedTrends.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="No Parameters Match Your Filters"
                description="Try adjusting your search terms or filters to see more results."
                searchTerm={searchTerm}
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredAndSortedTrends.map(renderParameterCard)}
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={BarChart3}
            title="No Parameter Trends Available"
            description="Parameter trends will appear here after lab reports are uploaded for this patient. Upload lab reports to see parameter trends and analysis."
          />
        )}
      </div>
    </div>
  );
}
