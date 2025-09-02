import { Badge } from '@/components/ui/badge';
import { LabValue } from '@/types/analysis';

export const statusBadge = (row: { processed: number; totalPrescriptions: number; failed: number }) => {
  const done = row.processed;
  const total = row.totalPrescriptions;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  if (done === total && total > 0) return <Badge variant="secondary">Complete ({pct}%)</Badge>;
  if (row.failed > 0) return <Badge variant="destructive">Failed {row.failed}/{total}</Badge>;
  if (total - done > 0) return <Badge>Pending {total - done}/{total}</Badge>;
  return <Badge variant="outline">No Data</Badge>;
};

export const urgencyBadge = (u: string | null) => {
  if (!u) return null;
  const v = u.toUpperCase();
  if (v === 'URGENT') return <Badge variant="destructive">URGENT</Badge>;
  if (v === 'SOON') return <Badge>SOON</Badge>;
  return <Badge variant="secondary">ROUTINE</Badge>;
};

export const labStatusBadge = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return <Badge variant="secondary">Completed</Badge>;
    case 'PROCESSING':
      return <Badge variant="default">Processing</Badge>;
    case 'PENDING':
      return <Badge variant="outline">Pending</Badge>;
    case 'FAILED':
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

export const standaloneStatusBadge = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
    case 'PROCESSING':
      return <Badge variant="outline" className="text-blue-600">Processing</Badge>;
    case 'FAILED':
      return <Badge variant="destructive">Failed</Badge>;
    case 'PENDING':
    default:
      return <Badge variant="outline" className="text-gray-600">Pending</Badge>;
  }
};

export const standaloneAnalysisStatusBadge = (analysis: { processingStatus: string }) => {
  switch (analysis.processingStatus) {
    case 'COMPLETED':
      return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
    case 'PROCESSING':
      return <Badge variant="outline" className="text-blue-600">Processing</Badge>;
    case 'FAILED':
      return <Badge variant="destructive">Failed</Badge>;
    case 'PENDING':
    default:
      return <Badge variant="outline" className="text-gray-600">Pending</Badge>;
  }
};

export const groupValuesByCategory = (values: LabValue[]) => {
  const grouped = values.reduce((acc, value) => {
    const category = value.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(value);
    return acc;
  }, {} as Record<string, LabValue[]>);

  return Object.entries(grouped).sort();
};
