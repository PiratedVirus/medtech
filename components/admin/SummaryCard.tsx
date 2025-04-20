import type React from "react"

interface SummaryCardProps {
  title: string
  value: string
  trend: string
  PrimaryIcon: React.ElementType
  OutlineIcon: React.ElementType
  accentColor?: string
  primaryIconColor?: string
  outlineIconColor?: string
}

export function SummaryCard({
  title,
  value,
  trend,
  PrimaryIcon,
  OutlineIcon,
  accentColor = "#F28A2E",
  primaryIconColor = "#134F30",
  outlineIconColor = "#134F30",
}: SummaryCardProps) {
  return (
    <div className="relative w-full h-[140px] overflow-hidden border border-gray-100 bg-custom-mutedgreen shadow-sm rounded-md">
      {/* Background outline icon rendered with reduced opacity */}
      <div className="absolute -right-8 -top-4 h-40 w-40 opacity-5">
        <OutlineIcon className="h-full w-full" style={{ color: outlineIconColor }} />
      </div>

      <div className="relative flex flex-col justify-between p-4">
        {/* Header Section */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[rgba(242,138,46,0.1)] to-[rgba(86,166,124,0.1)]">
            <PrimaryIcon className="h-5 w-5" style={{ color: primaryIconColor }} />
          </div>
          <span className="text-sm font-medium" style={{ color: accentColor }}>
            {title}
          </span>
        </div>

        {/* Main Content */}
        <div className="mt-4">
          <h3 className="mb-1 text-2xl font-semibold text-gray-800">{value}</h3>
          <p className="text-xs text-gray-600">{trend}</p>
        </div>
      </div>
    </div>
  )
}
