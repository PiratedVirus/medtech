'use client'
import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  LineChart
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import CdLoader from '@/components/ui/custom/cd-loader';

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
}

interface ParameterTrendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: number;
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

export default function ParameterTrendsModal({ isOpen, onClose, patientId }: ParameterTrendsModalProps) {
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParameter, setSelectedParameter] = useState<string | null>(null);
  const [filterAbnormal, setFilterAbnormal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && patientId) {
      fetchParameterTrends();
    }
  }, [isOpen, patientId]);

  const fetchParameterTrends = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/patient/${patientId}/parameter-trends`);
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

  const filteredTrends = useMemo(() => {
    let filtered = trends;

    if (searchTerm) {
      filtered = filtered.filter(trend => 
        trend.parameter.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterAbnormal) {
      filtered = filtered.filter(trend => trend.isAbnormal);
    }

    return filtered;
  }, [trends, searchTerm, filterAbnormal]);

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

  const parseReportDate = (value?: string) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatChartData = (values: ParameterValue[]) => {
    return values
      .map((value) => {
        const parsedDate = parseReportDate(value.reportDate);
        if (!parsedDate) return null;
        return {
          date: parsedDate.toLocaleDateString('en-GB'),
          value: parseFloat(value.value) || 0,
          unit: value.unit,
          isAbnormal: value.isAbnormal,
          severity: value.severity,
          fullDate: parsedDate.toLocaleDateString('en-GB'),
          sortKey: parsedDate.getTime()
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => (a.sortKey - b.sortKey))
      .map(({ sortKey, ...rest }) => rest);
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

  const renderParameterChart = (trend: TrendData) => {
    const chartData = formatChartData(trend.values);
    const normalRange = parseNormalRange(trend.normalRange);
    
    if (chartData.length === 0) return null;

    return (
      <Card key={trend.parameter} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">{trend.parameter}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={getSeverityColor(trend.severity)}>
                {trend.severity}
              </Badge>
              {getTrendIcon(trend.trend)}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Latest: {trend.latestValue} {trend.unit}</span>
            <span>Range: {trend.normalRange}</span>
            <span>Change: {trend.changePercent > 0 ? '+' : ''}{trend.changePercent.toFixed(1)}%</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ value: trend.unit, angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value: any, name: string, props: any) => [
                    `${value} ${props.payload.unit}`,
                    'Value'
                  ]}
                  labelFormatter={(label: string, payload: any) => {
                    if (payload && payload[0]) {
                      return `Date: ${payload[0].payload.fullDate}`;
                    }
                    return `Date: ${label}`;
                  }}
                />
                {normalRange && (
                  <>
                    <ReferenceLine 
                      y={normalRange.min} 
                      stroke="#10b981" 
                      strokeDasharray="5 5" 
                      label={{ value: "Normal Min", position: "top" }}
                    />
                    <ReferenceLine 
                      y={normalRange.max} 
                      stroke="#10b981" 
                      strokeDasharray="5 5" 
                      label={{ value: "Normal Max", position: "top" }}
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
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Parameter Trends</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-64">
            <CdLoader height="200px" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Parameter Trends
          </DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search parameters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button
            variant={filterAbnormal ? "default" : "outline"}
            onClick={() => setFilterAbnormal(!filterAbnormal)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Abnormal Only
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <LineChart className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Total Parameters</span>
              </div>
              <p className="text-2xl font-bold">{trends.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Abnormal</span>
              </div>
              <p className="text-2xl font-bold">{trends.filter(t => t.isAbnormal).length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Worsening</span>
              </div>
              <p className="text-2xl font-bold">{trends.filter(t => t.trend === 'WORSENING').length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Improving</span>
              </div>
              <p className="text-2xl font-bold">{trends.filter(t => t.trend === 'IMPROVING').length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Parameter Charts */}
        {filteredTrends.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No parameter trends found</p>
            <p className="text-gray-400 text-sm mt-2">
              {searchTerm ? 'Try adjusting your search terms' : 'Upload more lab reports to see trends'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTrends.map(renderParameterChart)}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

