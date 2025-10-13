import { useState, useEffect } from 'react';
import { Row, LabBooking, StandaloneReport } from '@/types/analysis';

export function useAnalysisData() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [labBookings, setLabBookings] = useState<LabBooking[]>([]);
  const [standaloneReports, setStandaloneReports] = useState<StandaloneReport[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch individual prescription data
      const res = await fetch(`/api/prescription/individual?q=${encodeURIComponent(query)}&take=50`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load prescriptions');
      setRows(data.rows as any[]);

      // Fetch lab analysis data
      const labRes = await fetch('/api/admin/optimized/lab-bookings?pageSize=100');
      const labData = await labRes.json();
      
      if (labData.data) {
        // Fetch analyses for each lab booking
        const bookingsWithAnalyses = await Promise.all(
          labData.data.map(async (booking: any) => {
            try {
              const analysesResponse = await fetch(`/api/admin/lab-analysis?labBookingId=${booking.id}`);
              const analysesData = await analysesResponse.json();
              
              return {
                id: booking.id,
                labPackageName: booking.labPackage?.name || 'Unknown Package',
                labResult: booking.labResult || [],
                analyses: analysesData.analyses || [],
                patient: booking.patient,
                createdAt: booking.createdAt,
                status: booking.status
              };
            } catch (error) {
              return {
                id: booking.id,
                labPackageName: booking.labPackage?.name || 'Unknown Package',
                labResult: booking.labResult || [],
                analyses: [],
                patient: booking.patient,
                createdAt: booking.createdAt,
                status: booking.status
              };
            }
          })
        );
        
        setLabBookings(bookingsWithAnalyses);
      }

      // Fetch standalone reports data
      const standaloneRes = await fetch('/api/admin/standalone-reports?pageSize=100');
      const standaloneData = await standaloneRes.json();
      
      if (standaloneData.success) {
        setStandaloneReports(standaloneData.data);
      }
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

  return {
    query,
    setQuery,
    loading,
    rows,
    labBookings,
    standaloneReports,
    error,
    fetchData
  };
}
