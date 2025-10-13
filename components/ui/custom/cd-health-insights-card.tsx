"use client";
import React, { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Card } from "@/components/ui/card";
import { Pencil } from "lucide-react";
import { AreaChart } from "@/components/ui/chart";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";

// -- shadcn UI imports --
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type CardProps = {
  title: string;
  reading: number;
  unit: string;
  statusLabel: string;
  color: string;
  imageSrc: string;
  data: { value: number }[];
  userId: number; // from HealthInsightsPanel
};

function darkenHex(hex: string, factor = 0.4) {
  let c = hex.replace(/^#/, "");
  if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];

  let r = parseInt(c.slice(0, 2), 16);
  let g = parseInt(c.slice(2, 4), 16);
  let b = parseInt(c.slice(4, 6), 16);

  r = Math.round(r * (1 - factor));
  g = Math.round(g * (1 - factor));
  b = Math.round(b * (1 - factor));

  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));

  const rr = r.toString(16).padStart(2, "0");
  const gg = g.toString(16).padStart(2, "0");
  const bb = b.toString(16).padStart(2, "0");
  return `#${rr}${gg}${bb}`;
}

export default function HealthInsightsCard({
  title,
  reading,
  unit,
  statusLabel,
  color,
  imageSrc,
  data,
  userId,
}: CardProps) {
  // Modal open/close state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Form fields
  const [newReading, setNewReading] = useState("");
  const [recordedAt, setRecordedAt] = useState("");

  // Get query client for cache invalidation (following codebase patterns)
  const queryClient = useQueryClient();

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Validate form data
    if (!newReading || newReading.trim() === "") {
      toast.error("Please enter a reading value");
      return;
    }
    
    if (!userId) {
      toast.error("User ID is missing");
      return;
    }
    
    try {
      const requestData = {
        userId,
        metricName: title, // same metric as this card
        reading: newReading,
        recordedAt: recordedAt || undefined, // Only send if provided
      };
      
      console.log("HealthInsightsCard - Sending request:", requestData);
      
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const json = await response.json();
      console.log("HealthInsightsCard - API response:", json);
      
      if (json.success) {
        toast.success("New record added!");
        setIsModalOpen(false);
        // Reset form
        setNewReading("");
        setRecordedAt("");
        // Invalidate all insights-related queries to force refetch
        // Invalidate health insights cache (following codebase patterns)
        queryClient.invalidateQueries({ queryKey: ["insightsPanel"] });
        queryClient.invalidateQueries({ queryKey: ["insights"] });
        queryClient.invalidateQueries({ queryKey: ["health-insights"] });
      } else {
        console.error("HealthInsightsCard - API error:", json.error);
        toast.error(`Error: ${json.error}`);
      }
    } catch (error) {
      console.error("Error posting new metric:", error);
      toast.error("Failed to create metric");
    }
  }

  const darkerLineColor = darkenHex(color, 0.4);

  return (
    <>
    <ToastContainer />
    <Card className="w-60 h-80 p-6 rounded-3xl bg-white border">
      <div className="flex items-center gap-4 mb-8">
        <Image
          className="flex"
          src={imageSrc}
          width={58}
          height={58}
          alt={title}
        />
        <h2 className="text-xl font-medium">{title}</h2>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-5xl font-medium">{reading}</span>
        <span className="text-gray-500 text-xl">{unit}</span>
        <Button variant="ghost" onClick={() => setIsModalOpen(true)}>
          <Pencil className="w-4 h-4 text-gray-400" />
        </Button>
      </div>

      <div className="inline-block mb-6">
        <div className="px-4 py-1 rounded-full" style={{ backgroundColor: color }}>
          <span className="text-sm font-medium">{statusLabel}</span>
        </div>
      </div>

      {/* Mini chart (optional) */}
      <div className="h-20">
        <AreaChart
          lineColor={darkerLineColor}
          data={data}
          className="h-20"
          showXAxis={false}
          showYAxis={false}
          showGridLines={false}
        />
      </div>

      {/* Shadcn Dialog for adding a new reading */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New {title} Reading</DialogTitle>
            <DialogDescription>
              Provide a new reading and date/time for this metric.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="reading">Reading</Label>
              <Input
                id="reading"
                type="number"
                step="any"
                value={newReading}
                onChange={(e) => setNewReading(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="recordedAt">Recorded At</Label>
              <Input
                id="recordedAt"
                type="datetime-local"
                value={recordedAt}
                onChange={(e) => setRecordedAt(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
    </>

  );
}