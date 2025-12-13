import React from "react";

export interface TrackedValue {
  name: string;
  value: string | number;
  unit?: string;
  normalRange?: string;
  isAbnormal?: boolean;
  severity?: string;
  reportDate?: string;
}

interface TrackedValuesListProps {
  values: TrackedValue[];
  loading?: boolean;
  onUntrack?: (name: string) => void;
  showUntrack?: boolean;
  emptyText?: string;
}

const getSeverityClasses = (severity?: string, isAbnormal?: boolean) => {
  const s = (severity || "NORMAL").toUpperCase();
  if (!isAbnormal || s === "NORMAL") {
    return { bg: "bg-emerald-100", text: "text-emerald-700" } as const;
  }
  if (s === "CRITICAL") return { bg: "bg-red-100", text: "text-red-700" } as const;
  if (s === "HIGH") return { bg: "bg-orange-100", text: "text-orange-700" } as const;
  if (s === "LOW") return { bg: "bg-sky-100", text: "text-sky-700" } as const;
  return { bg: "bg-gray-100", text: "text-gray-700" } as const;
};

export default function TrackedValuesList({
  values,
  loading = false,
  onUntrack,
  showUntrack = true,
  emptyText = "No lab values available",
}: TrackedValuesListProps) {
  if (loading) {
    return <div className="text-sm text-gray-500">Loading lab values...</div>;
  }

  if (!values.length) {
    return <div className="text-sm text-gray-500">{emptyText}</div>;
  }

  return (
    <div className="max-h-36 overflow-y-auto pr-1 custom-scrollbar">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
        {values.map((checkup, index) => {
          const s = getSeverityClasses(checkup.severity, checkup.isAbnormal);
          return (
            <div
              key={`${checkup.name}-${index}`}
              className={`group relative flex items-center gap-2 rounded-full ${s.bg} h-8 px-3 shadow-sm`}
              title={checkup.normalRange ? `Normal: ${checkup.normalRange}` : undefined}
            >
              <div className="flex items-center w-full gap-2">
                <span className="flex-1 truncate text-[13px] font-semibold text-gray-700" title={checkup.name}>
                  {checkup.name}
                </span>
                <span className="ml-auto inline-flex items-baseline gap-1.5">
                  <span className={`text-[13px] font-bold ${s.text}`}>{checkup.value}</span>
                  {checkup.unit && <span className="text-[11px] text-gray-600">{checkup.unit}</span>}
                </span>
              </div>
              {showUntrack && onUntrack && (
                <button
                  className="absolute right-1 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center rounded-full bg-white/70 hover:bg-red-100 text-gray-600 hover:text-red-600 h-6 w-6 transition-opacity opacity-0 group-hover:opacity-100"
                  title="Untrack"
                  onClick={() => onUntrack(checkup.name)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                    <path
                      fillRule="evenodd"
                      d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.476l-.209-.035-1.005 12.063A3.75 3.75 0 0115.168 22H8.832a3.75 3.75 0 01-3.74-3.279L4.087 6.658l-.209.035a.75.75 0 11-.256-1.476A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.969a52.662 52.662 0 013.368 0C15.287 1.805 16.5 3.141 16.5 4.705zm-6.136-1.47a51.196 51.196 0 013.272 0C14.454 3.074 15 3.62 15 4.295v.26a49.488 49.488 0 00-6 0v-.26c0-.674.546-1.22 1.364-1.287zM9.75 9a.75.75 0 00-1.5 0v8.25a.75.75 0 001.5 0V9zm3 0a.75.75 0 00-1.5 0v8.25a.75.75 0 001.5 0V9zm3 0a.75.75 0 00-1.5 0v8.25a.75.75 0 001.5 0V9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

