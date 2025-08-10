"use client";
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminAuth } from '@/hooks/use-admin-auth';

interface Row {
  id: number;
  name: string;
  phone: string | null;
  totalPrescriptions: number;
  processed: number;
  failed: number;
  pending: number;
  urgency: string | null;
  lastUpdated: string | null;
  prescriptionCountInSummary: number;
  llmModel: string | null;
  hasSummary: boolean;
}

export default function PatientsAnalysisPage() {
  useAdminAuth();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/prescription/analysis-status?q=${encodeURIComponent(query)}&take=50`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load');
      setRows(data.rows as Row[]);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProcessAll = async (patientId: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/prescription/process-all/${patientId}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to process');
      await fetchData();
    } catch (e: any) {
      setError(e?.message || 'Failed to process');
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (row: Row) => {
    const done = row.processed;
    const total = row.totalPrescriptions;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    if (done === total && total > 0) return <Badge variant="secondary">Complete ({pct}%)</Badge>;
    if (row.failed > 0) return <Badge variant="destructive">Failed {row.failed}/{total}</Badge>;
    if (row.pending > 0) return <Badge>Pending {row.pending}/{total}</Badge>;
    return <Badge variant="outline">No Data</Badge>;
  };

  const urgencyBadge = (u: string | null) => {
    if (!u) return null;
    const v = u.toUpperCase();
    if (v === 'URGENT') return <Badge variant="destructive">URGENT</Badge>;
    if (v === 'SOON') return <Badge>SOON</Badge>;
    return <Badge variant="secondary">ROUTINE</Badge>;
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Prescription AI Analysis</CardTitle>
          <div className="flex gap-2">
            <Input
              placeholder="Search patient name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') fetchData(); }}
              className="w-64"
            />
            <Button onClick={fetchData} disabled={loading}>Search</Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-3 text-sm text-red-600">{error}</div>
          )}
          <div className="overflow-auto border rounded-md">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2">Patient</th>
                  <th className="text-left px-3 py-2">Phone</th>
                  <th className="text-left px-3 py-2">Prescriptions</th>
                  <th className="text-left px-3 py-2">Processed</th>
                  <th className="text-left px-3 py-2">Failed</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-left px-3 py-2">Urgency</th>
                  <th className="text-left px-3 py-2">Summary</th>
                  <th className="text-left px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-3 py-6 text-center text-muted-foreground">
                      {loading ? 'Loading...' : 'No patients found'}
                    </td>
                  </tr>
                )}
                {rows.map(row => (
                  <tr key={row.id} className="border-t">
                    <td className="px-3 py-2">
                      <div className="font-medium">{row.name}</div>
                      <div className="text-xs text-muted-foreground">ID: {row.id}</div>
                    </td>
                    <td className="px-3 py-2">{row.phone || '-'}</td>
                    <td className="px-3 py-2">{row.totalPrescriptions}</td>
                    <td className="px-3 py-2">{row.processed}</td>
                    <td className="px-3 py-2">{row.failed}</td>
                    <td className="px-3 py-2">{statusBadge(row)}</td>
                    <td className="px-3 py-2">{urgencyBadge(row.urgency)}</td>
                    <td className="px-3 py-2">
                      {row.hasSummary ? (
                        <div className="text-xs text-muted-foreground">
                          Updated: {row.lastUpdated ? new Date(row.lastUpdated).toLocaleString() : '-'}
                          <br />
                          Count: {row.prescriptionCountInSummary}
                          <br />
                          Model: {row.llmModel || '-'}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No summary</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <Button size="sm" variant="default" onClick={() => handleProcessAll(row.id)} disabled={loading}>
                          Process All
                        </Button>
                        <Link href={`/dashboard/patient-profile?patientId=${row.id}`}>
                          <Button size="sm" variant="outline">View Profile</Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


