"use client"

import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from "recharts"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  {
    name: "Dr. Smith",
    utilization: 92,
  },
  {
    name: "Dr. Johnson",
    utilization: 78,
  },
  {
    name: "Dr. Williams",
    utilization: 86,
  },
  {
    name: "Dr. Brown",
    utilization: 65,
  },
  {
    name: "Dr. Jones",
    utilization: 72,
  },
  {
    name: "Dr. Garcia",
    utilization: 88,
  },
]

export function DoctorUtilizationChart() {
  return (
    <ChartContainer
      config={{
        utilization: {
          label: "Utilization %",
          color: "hsl(var(--chart-4))",
        },
      }}
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={data}>
          <XAxis
            type="number"
            domain={[0, 100]}
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}%`}
          />
          <YAxis dataKey="name" type="category" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="utilization" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.utilization > 85
                    ? "hsl(142, 76%, 36%)"
                    : entry.utilization > 70
                      ? "hsl(48, 96%, 53%)"
                      : "hsl(0, 84%, 60%)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
