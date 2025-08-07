import React from "react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, Filter, User, Clock } from "lucide-react";
import { format } from "date-fns";

interface SectionHeaderProps {
  title: string;
  showDate?: boolean;
  showFilters?: boolean;
  showScrollControls?: boolean;
  filterStatus?: 'all' | 'assigned' | 'unassigned';
  onFilterChange?: (status: 'all' | 'assigned' | 'unassigned') => void;
  onScroll?: (direction: 'left' | 'right') => void;
  stats?: {
    total: number;
    assigned?: number;
    unassigned?: number;
  };
}

export default function SectionHeader({
  title,
  showDate = false,
  showFilters = false,
  showScrollControls = false,
  filterStatus = 'all',
  onFilterChange,
  onScroll,
  stats
}: SectionHeaderProps) {
  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle className="text-xl font-semibold text-gray-800">
          {title}
        </CardTitle>
        <div className="flex items-center space-x-3">
          {showDate && (
            <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-lg">
              <Calendar className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800">{format(new Date(), "dd-MM-yyyy")}</span>
            </div>
          )}
          
          {showFilters && onFilterChange && stats && (
            <div className="flex items-center space-x-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFilterChange('all')}
                className={`${filterStatus === 'all' ? 'bg-primary text-white' : 'text-gray-600'} flex items-center space-x-1`}
              >
                <Filter className="h-4 w-4" />
                <span>All ({stats.total})</span>
              </Button>
              <Button
                variant={filterStatus === 'assigned' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFilterChange('assigned')}
                className={`${filterStatus === 'assigned' ? 'bg-green-600 text-white' : 'text-gray-600'} flex items-center space-x-1`}
              >
                <User className="h-4 w-4" />
                <span>Assigned ({stats.assigned || 0})</span>
              </Button>
              <Button
                variant={filterStatus === 'unassigned' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFilterChange('unassigned')}
                className={`${filterStatus === 'unassigned' ? 'bg-orange-600 text-white' : 'text-gray-600'} flex items-center space-x-1`}
              >
                <Clock className="h-4 w-4" />
                <span>Unassigned ({stats.unassigned || 0})</span>
              </Button>
            </div>
          )}
          
          {showScrollControls && onScroll && (
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onScroll('left')}
                className="p-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onScroll('right')}
                className="p-2"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </CardHeader>
  );
} 