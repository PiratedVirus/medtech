"use client"

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { name: "Basic", value: 540 },
  { name: "Standard", value: 620 },
  { name: "Premium", value: 210 },
  { name: "Care+", value: 116 },
]

export function SubscriptionPlanChart() {
  return (
    <ChartContainer
      config={{
        value: {
          label: "Subscriptions",
          color: "hsl(var(--chart-3))",
        },
      }}
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="var(--color-value)"
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={`hsl(${index * 90}, 70%, 50%)`} />
            ))}
          </Pie>
          <ChartTooltip content={<ChartTooltipContent />} />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
