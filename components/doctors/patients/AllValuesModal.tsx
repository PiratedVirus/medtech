"use client";
import React, { useEffect, useState, useImperativeHandle, forwardRef, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

interface AllValuesModalProps {
  patientId: string;
  onClose: () => void;
  onChanged?: () => void;
  trackedParameters?: string[];
  onToggleOverride?: (parameter: string, makeTracked: boolean, values?: ValueEntry[]) => Promise<void> | void;
}

export interface AllValuesModalRef {
  refresh: () => void;
}

export interface ValueEntry {
  parameter?: string;
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

const AllValuesModal = forwardRef<AllValuesModalRef, AllValuesModalProps>(
  ({ patientId, onClose, onChanged, onToggleOverride, trackedParameters }, ref) => {
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchRows = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/patient/${patientId}/all-values`);
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load');
        const incomingRows = (data.data.rows as Row[]).map((row) => ({
          ...row,
          values: (row.values || []).map((v) => ({
            ...v,
            parameter: v.parameter || row.parameter,
          })),
        }));
        setRows(incomingRows);
      } catch (e: any) {
        setError(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };

    useImperativeHandle(ref, () => ({
      refresh: fetchRows
    }));

    useEffect(() => {
      fetchRows();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleToggle = async (parameter: string, makeTracked: boolean) => {
      // If consumer wants to manage tracking, delegate to them and sync UI optimistically
      if (onToggleOverride) {
        try {
          await onToggleOverride(parameter, makeTracked, rows.find(r => r.parameter.toLowerCase() === parameter.toLowerCase())?.values);
          setRows(prev =>
            prev.map(row =>
              row.parameter.toLowerCase() === parameter.toLowerCase()
                ? { ...row, isTracked: makeTracked }
                : row
            )
          );
        } catch (error) {
          console.error('Error in toggle override:', error);
        }
        return;
      }
      try {
        const response = await fetch(`/api/patient/${patientId}/tracked-values/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parameter, isTracked: makeTracked })
        });
        
        if (response.ok) {
          // Immediately update the UI optimistically
          setRows(prevRows => 
            prevRows.map(row => 
              row.parameter.toLowerCase() === parameter.toLowerCase()
                ? { ...row, isTracked: makeTracked }
                : row
            )
          );
          
          // Refresh data from server
          await fetchRows();
          
          // Notify parent to refresh pills
          onChanged?.();
        }
      } catch (error) {
        console.error('Error toggling track status:', error);
        // Revert on error by refreshing
        await fetchRows();
      }
    };

    // Filter rows based on search term
    const filteredRows = useMemo(() => {
      if (!searchTerm.trim()) {
        return rows;
      }
      
      const searchLower = searchTerm.toLowerCase().trim();
      return rows.filter(row => {
        // Search in parameter name
        if (row.parameter.toLowerCase().includes(searchLower)) {
          return true;
        }
        
        // Search in values
        return row.values.some(v => {
          const valueStr = String(v.value).toLowerCase();
          const unitStr = (v.unit || '').toLowerCase();
          return valueStr.includes(searchLower) || unitStr.includes(searchLower);
        });
      });
    }, [rows, searchTerm]);

    return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-[900px] max-w-[95vw] rounded-xl bg-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b">
          <h3 className="text-lg font-semibold">All Values</h3>
          <div className="flex items-center gap-3 w-full sm:w-auto sm:min-w-[320px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search parameters or values..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button className="text-gray-500 hover:text-gray-700" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>
        {searchTerm && (
          <div className="px-5 pt-2 text-sm text-gray-500">
            Showing {filteredRows.length} of {rows.length} parameters
          </div>
        )}
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-gray-500">No values available.</div>
          ) : filteredRows.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-8">
              No parameters match your search "{searchTerm}"
            </div>
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
                {filteredRows.map((row) => {
                  const computedIsTracked = trackedParameters
                    ? trackedParameters.some(p => p.toLowerCase() === row.parameter.toLowerCase())
                    : row.isTracked;
                  return (
                  <tr key={row.parameter} className="border-b last:border-b-0">
                    <td className="py-2 pr-2">
                      <div className="font-medium text-gray-800">
                        {row.parameter.charAt(0).toUpperCase() + row.parameter.slice(1)}
                      </div>
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
                      {computedIsTracked ? (
                        <button onClick={() => handleToggle(row.parameter, false)} className="rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200">Untrack</button>
                      ) : (
                        <button onClick={() => handleToggle(row.parameter, true)} className="rounded-md bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-200">Track</button>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
    );
  }
);

AllValuesModal.displayName = 'AllValuesModal';

export default AllValuesModal;
