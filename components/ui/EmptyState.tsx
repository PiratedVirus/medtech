"use client";

import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  searchTerm?: string;
  className?: string;
}

/**
 * Reusable empty state component for consistent "not found" messages
 * Used across prescriptions, appointments, doctors, dieticians, labs, etc.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  searchTerm,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`text-center py-16 ${className}`}>
      <Icon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <p className="text-xl font-semibold text-gray-700 mb-2">{title}</p>
      <p className="text-gray-500">
        {searchTerm
          ? `No results match your search "${searchTerm}". Try a different search term.`
          : description}
      </p>
    </div>
  );
}
