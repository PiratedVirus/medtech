"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import CdLoader from "@/components/ui/custom/cd-loader";
import { cn } from "@/lib/utils";

interface HealthMetric {
  id: number;
  metricName: string;
  reading: number;
  recordedAt: string;
  unit: string;
}

interface HealthInsightsTableProps {
  patientId: number;
  isOpen: boolean;
  onClose: () => void;
}

const ITEMS_PER_PAGE = 10;

export default function HealthInsightsTable({ patientId, isOpen, onClose }: HealthInsightsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["health-metrics", patientId, currentPage, searchQuery],
    queryFn: async () => {
      const response = await fetch(
        `/api/admin/health-metrics?patientId=${patientId}&page=${currentPage}&search=${searchQuery}`
      );
      if (!response.ok) throw new Error("Failed to fetch metrics");
      return response.json();
    },
    enabled: isOpen,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const totalPages = data?.pagination?.totalPages || 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogTitle>Health Metrics History</DialogTitle>

        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search metrics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">Search</Button>
          </div>
        </form>

        {isLoading ? (
          <div className="flex justify-center p-4">
            <CdLoader />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="p-2 text-left">Metric</th>
                    <th className="p-2 text-left">Reading</th>
                    <th className="p-2 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.metrics.map((metric: any) => (
                    <tr key={metric.id} className="border-b">
                      <td className="p-2">{metric.metricName}</td>
                      <td className="p-2">{metric.reading}</td>
                      <td className="p-2">
                        {new Date(metric.recordedAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}