"use client";
import React, { useEffect, useState } from "react";

interface AllValuesModalProps {
  patientId: string;
  onClose: () => void;
  onChanged?: () => void;
}

interface ValueEntry {
  value: string | number;
  unit?: string;
  normalRange?: string;
  isAbnormal?: boolean;
  severity?: string;
  reportDate?: string;
  labDate?: Date;
  reportId?: number;
  labBookingId?: number;
  source?: string;
}

interface Row {
  parameter: string;
  isTracked: boolean;
  values: ValueEntry[];
}

export default function AllValuesModal({ patientId, onClose, onChanged }: AllValuesModalProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRows = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/patient/${patientId}/all-values`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load');
      setRows(data.data.rows as Row[]);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = async (parameter: string, makeTracked: boolean) => {
    try {
      await fetch(`/api/patient/${patientId}/tracked-values/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parameter, isTracked: makeTracked })
      });
      await fetchRows();
      onChanged?.();
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-[900px] max-w-[95vw] rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h3 className="text-lg font-semibold">All Values (Lab Reports & Standalone Reports)</h3>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-gray-500">No values available.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2 pr-2 w-1/4">Parameter</th>
                  <th className="py-2 pr-2 w-2/4">Values</th>
                  <th className="py-2 pr-2 w-1/4">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.parameter} className="border-b last:border-b-0">
                    <td className="py-2 pr-2">
                      <div className="font-medium text-gray-800">{row.parameter}</div>
                    </td>
                    <td className="py-2 pr-2">
                      <div className="flex flex-wrap gap-1.5">
                        {row.values.map((v, idx) => {
                          const date = v.labDate || new Date(v.reportDate || 0);
                          const sourceColor = v.source === 'standalone_report' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700';
                          return (
                            <span key={idx} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] ${sourceColor}`}>
                              <span className="font-semibold">{v.value}</span>
                              {v.unit && <span className="text-gray-500">{v.unit}</span>}
                              <span className="text-gray-400">· {date.toLocaleDateString()}</span>
                              {v.severity && v.severity !== 'NORMAL' && (
                                <span className="ml-1 rounded bg-orange-100 px-1.5 py-0.5 text-[11px] text-orange-700">{v.severity}</span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-2 pr-2">
                      {row.isTracked ? (
                        <button onClick={() => handleToggle(row.parameter, false)} className="rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200">Untrack</button>
                      ) : (
                        <button onClick={() => handleToggle(row.parameter, true)} className="rounded-md bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-200">Track</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
