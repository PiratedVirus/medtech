"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  {
    name: "Scheduled",
    total: 45,
  },
  {
    name: "Confirmed",
    total: 32,
  },
  {
    name: "Completed",
    total: 78,
  },
  {
    name: "Cancelled",
    total: 13,
  },
  {
    name: "No-Show",
    total: 8,
  },
  {
    name: "Rescheduled",
    total: 21,
  },
]

export function AppointmentStatusChart() {
  return (
    <ChartContainer
      config={{
        total: {
          label: "Appointments",
          color: "hsl(var(--chart-1))",
        },
      }}
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
