'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useQuery } from '@tanstack/react-query'
import CdLoader from '@/components/ui/custom/cd-loader'
import HealthInsightsCard from '@/components/ui/custom/cd-health-insights-card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

// Colors (reused from dashboard/insights)
const BAR_FILL_NORMAL = '#E6F4F1'
const BAR_FILL_HOVER = '#064e3b'

type MonthData = {
  month: string
  average: number
}

type MetricData = {
  metricName: string
  data: MonthData[]
}

const DEFAULT_METRICS = [
  'Blood Pressure',
  'Blood Glucose',
  'Body Fat',
  'Muscle Mass',
  'BMI',
  'Visceral Fat',
]

const METRIC_CONFIG: Record<string, { color: string; imageSrc: string; unit: string; statusLabel: string }> = {
  'Blood Glucose': { color: '#F8E5D3', imageSrc: '/icons/blood.svg', unit: 'mg/dL', statusLabel: 'Normal' },
  'Body Fat': { color: '#FAD4D4', imageSrc: '/icons/body-fat.svg', unit: '%', statusLabel: 'Normal' },
  'Muscle Mass': { color: '#D4F1F9', imageSrc: '/icons/muscle.svg', unit: '%', statusLabel: 'Normal' },
  BMI: { color: '#F9D4D4', imageSrc: '/icons/bmi.svg', unit: '', statusLabel: 'Normal' },
  'Blood Pressure': { color: '#E0C6FC', imageSrc: '/icons/water.svg', unit: 'mm/hg', statusLabel: 'Normal' },
  'Visceral Fat': { color: '#C6DAFC', imageSrc: '/icons/v-fat.svg', unit: 'level', statusLabel: 'Normal' },
}

function formatMonthLabel(ymString: string) {
  const [year, month] = ymString.split('-')
  const date = new Date(Number(year), Number(month) - 1)
  return date.toLocaleString('default', { month: 'short' })
}

function generateEmptyMonthlyData(): MonthData[] {
  const data: MonthData[] = []
  const today = new Date()
  for (let i = 5; i >= 0; i--) {
    const date = new Date()
    date.setMonth(today.getMonth() - i)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    data.push({ month: `${year}-${month}`, average: 0 })
  }
  return data
}

interface PatientInsightsModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: number
}

export default function PatientInsightsModal({ isOpen, onClose, patientId }: PatientInsightsModalProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['insights', patientId],
    queryFn: async () => {
      const res = await fetch(`/api/insights?userId=${patientId}`)
      return res.json()
    },
    enabled: isOpen && !!patientId,
    staleTime: 0, // Always consider data stale
    refetchOnMount: true, // Always refetch on mount
    refetchOnWindowFocus: true, // Refetch when window gains focus
  })

  // Build metrics map like dashboard page
  let metricsMap = new Map<string, MetricData>()
  DEFAULT_METRICS.forEach((metricName) => {
    metricsMap.set(metricName, { metricName, data: generateEmptyMonthlyData() })
  })
  if (data?.success && data?.metrics?.length > 0) {
    data.metrics.forEach((metric: MetricData) => {
      metricsMap.set(metric.metricName, metric)
      if (!DEFAULT_METRICS.includes(metric.metricName)) {
        metricsMap.set(metric.metricName, metric)
      }
    })
  }
  const metrics: MetricData[] = Array.from(metricsMap.values())

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[1100px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Full Insights</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <CdLoader />
          </div>
        ) : (
          <div className="space-y-8">
            {metrics.map((metric) => (
              <MetricChartRow key={metric.metricName} metric={metric} />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function MetricChartRow({ metric }: { metric: MetricData }) {
  const [hoverIndex, setHoverIndex] = React.useState(-1)
  const lastSixMonths = metric.data.slice(-6).map((m) => ({ ...m, month: formatMonthLabel(m.month) }))
  const latest = lastSixMonths[lastSixMonths.length - 1]?.average ?? 0
  const config = METRIC_CONFIG[metric.metricName] || {
    color: '#FDFDFD',
    imageSrc: '/icons/blood4.svg',
    unit: '',
    statusLabel: 'Normal',
  }

  // Update status label if no data
  const statusLabel = latest === 0 && metric.data.every((m) => m.average === 0) ? 'No Data' : config.statusLabel

  return (
    <div className="flex flex-col lg:flex-row gap-5 items-center lg:items-start">
      <div className="bg-white rounded-xl p-6 w-full lg:w-2/3">
        <h2 className="text-xl font-semibold mb-4">{metric.metricName}</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={lastSixMonths} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(val) => (config.unit ? `${val}${config.unit}` : (val as any))} />
            <Tooltip cursor={{ fill: 'none' }} />
            <Bar dataKey="average" shape={(props: any) => <BottomStrokeBar {...props} />}>
              {lastSixMonths.map((entry: MonthData, index: number) => (
                <Cell
                  key={`cell-${index}`}
                  fill={hoverIndex === index ? BAR_FILL_HOVER : BAR_FILL_NORMAL}
                  onMouseEnter={() => setHoverIndex(index)}
                  onMouseLeave={() => setHoverIndex(-1)}
                  cursor="pointer"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full lg:w-1/3 pl-0 lg:pl-6 mt-6 lg:mt-0">
        <HealthInsightsCard
          title={metric.metricName}
          reading={latest}
          unit={config.unit}
          statusLabel={statusLabel}
          color={config.color}
          imageSrc={config.imageSrc}
          data={lastSixMonths.map((d) => ({ value: d.average }))}
          userId={0}
        />
      </div>
    </div>
  )
}

function BottomStrokeBar(props: any) {
  const { x, y, width, height, fill } = props
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} />
      <line x1={x} y1={y + height} x2={x + width} y2={y + height} stroke="#064e3b" strokeWidth={2} />
    </g>
  )
}


