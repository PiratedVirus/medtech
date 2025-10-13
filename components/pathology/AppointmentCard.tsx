import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Upload, FileText } from "lucide-react";
import { format } from "date-fns";
import { getStatusDisplay, getStatusColor } from "@/lib/utils/statusMapping";
import { LabAssignmentStatus } from '@prisma/client';
import ViewReportsModal from "./ViewReportsModal";

interface Payment {
  id: number;
  amount: number;
  paymentStatus: string;
  paymentMethod?: string;
  currency: string;
}

interface LabBooking {
  id: number;
  fullName: string;
  mobile: string;
  email: string;
  address: string;
  paymentOption: string;
  status: string;
  labDate: string;
  labResult: string[];
  labPackage: {
    id: number;
    name: string;
    price: number;
  };
  payment?: Payment | null;
}

interface AppointmentCardProps {
  type: 'upcoming' | 'ongoing' | 'completed';
  data: {
    id: number;
    labBookingId?: number;
    labAssignmentId?: number;
    patientName?: string;
    appointmentFor?: string;
    assignedPhlebotomist?: string;
    status: string;
    assignmentStatus?: string;
    doctorAvailability?: {
      date: string;
      startTime: string;
    };
    startTime?: string;
    assignedDate?: string;
    assignedTime?: string;
    labBooking?: LabBooking;
    patient?: {
      name: string;
    };
    phlebotomist?: {
      user: {
        name: string;
      };
    };
  };
  onAssignPhlebotomist?: (appointment: any) => void;
  onStartAppointment?: (appointment: any) => void;
  onUpdateStatus?: (assignment: any) => void;
  onUploadReports?: (assignment: any) => void;
  onViewReports?: (assignment: any) => void;
}

export default function AppointmentCard({
  type,
  data,
  onAssignPhlebotomist,
  onStartAppointment,
  onUpdateStatus,
  onUploadReports,
  onViewReports
}: AppointmentCardProps) {
  const [showViewReportsModal, setShowViewReportsModal] = useState(false);
  const getBookingId = () => {
    // Always prioritize labBookingId, fallback to labBooking.id, then data.id
    return data.labBookingId || data.labBooking?.id || data.id;
  };

  const getStatus = () => {
    return data.assignmentStatus || data.status;
  };

  const getPatientName = () => {
    return data.patientName || data.patient?.name || 'Unknown Patient';
  };

  const getAppointmentFor = () => {
    return data.appointmentFor || data.labBooking?.labPackage?.name || 'Lab Test';
  };

  const getPhlebotomistName = () => {
    return data.assignedPhlebotomist || data.phlebotomist?.user?.name || 'Phlebotomist';
  };

  const getDateDisplay = () => {
    // Always prefill date from lab booking date if present
    const labDate = data.labBooking?.labDate;
    if (labDate) {
      return {
        date: format(new Date(labDate), "dd-MMM-yyyy"),
        time: data.assignedTime || 'Time TBD',
      };
    }

    // If no lab booking date, fallback to assigned date/time if available
    if (data.assignedDate) {
      return {
        date: format(new Date(data.assignedDate), "dd-MMM-yyyy"),
        time: data.assignedTime || 'Time TBD',
      };
    }

    // Fallback to any appointment date present
    if (data.doctorAvailability?.date) {
      return {
        date: data.doctorAvailability.date,
        time: data.startTime || 'Time TBD',
      };
    }

    return { date: 'Date TBD', time: 'Time TBD' };
  };

  const getPaymentBadge = () => {
    const payment = data.labBooking?.payment;
    if (!payment) return null;
    const amountInRupees = typeof payment.amount === 'number' ? (payment.amount / 100) : payment.amount;
    return {
      text: payment.paymentStatus?.toUpperCase() === "PAID" ? "Paid" : `Collect ₹${amountInRupees}`,
      isPaid: payment.paymentStatus?.toUpperCase() === "PAID",
    };
  };

  const renderUpcomingActions = () => {
    if (data.assignedPhlebotomist) {
      return (
        <Button
          variant="outline"
          size="sm"
          className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
          onClick={() => onStartAppointment?.(data)}
        >
          <Play className="h-4 w-4 mr-2" />
          <span>Start Appointment</span>
        </Button>
      );
    }
    
    return (
      <Button
        variant="default"
        size="sm"
        className="w-full font-semibold"
        onClick={() => onAssignPhlebotomist?.(data)}
      >
        Assign Phlebotomist
      </Button>
    );
  };

  const renderOngoingActions = () => {
    return (
      <div className="space-y-3">
        {/* First row - Update Status and Upload Reports */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-primary font-semibold"
            onClick={() => onUpdateStatus?.(data)}
          >
            Update Status
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50 flex items-center space-x-2"
            onClick={() => onUploadReports?.(data)}
          >
            <Upload className="h-4 w-4" />
            <span>Upload Reports</span>
          </Button>
        </div>
        
        {/* Second row - View Reports (centered) */}
        {data.labBooking?.labResult && data.labBooking.labResult.length > 0 && (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80 hover:bg-primary/10 flex items-center space-x-2"
              onClick={() => setShowViewReportsModal(true)}
            >
              <FileText className="h-4 w-4" />
              <span>View Reports ({data.labBooking.labResult.length})</span>
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderCompletedActions = () => {
    return (
      <div className="space-y-3">
        {/* First row - Update Status and Upload Reports */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-primary font-semibold"
            onClick={() => onUpdateStatus?.(data)}
          >
            Update Status
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50 flex items-center space-x-2"
            onClick={() => onUploadReports?.(data)}
          >
            <Upload className="h-4 w-4" />
            <span>Upload Reports</span>
          </Button>
        </div>
        
        {/* Second row - View Reports (centered) */}
        {data.labBooking?.labResult && data.labBooking.labResult.length > 0 && (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80 hover:bg-primary/10 flex items-center space-x-2"
              onClick={() => setShowViewReportsModal(true)}
            >
              <FileText className="h-4 w-4" />
              <span>View Reports ({data.labBooking.labResult.length})</span>
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderAssignmentInfo = () => {
    if (type === 'upcoming') {
      if (data.assignedPhlebotomist) {
        return (
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-600 mb-1">Assigned Phlebotomist</p>
            <p className="font-semibold text-green-700">
              {getPhlebotomistName()}
            </p>
          </div>
        );
      }
      
      return (
        <div className="bg-orange-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-600 mb-1">Status</p>
                      <p className="font-semibold text-orange-700">
              {getStatusDisplay(getStatus() as LabAssignmentStatus, 'pathology')}
            </p>
        </div>
      );
    }

    if (type === 'ongoing') {
      return (
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-600 mb-1">Assigned Phlebotomist</p>
          <p className="font-semibold text-green-700">
            {getPhlebotomistName()}
          </p>
        </div>
      );
    }

    if (type === 'completed') {
      return (
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-600 mb-1">Assigned Phlebotomist</p>
          <p className="font-semibold text-green-700">
            {getPhlebotomistName()}
          </p>
        </div>
      );
    }
  };


  const dateDisplay = getDateDisplay();
  const paymentBadge = getPaymentBadge();

  return (
    <Card className="bg-custom-mutedgreen flex-shrink-0 w-80 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-5">
        <div className="space-y-4">
          {/* Booking ID Badge */}
          <div className="flex justify-between items-start">
            <Badge className="bg-blue-100 text-blue-800 text-xs font-medium">
              #{getBookingId()}
            </Badge>
            <Badge className={getStatusColor(getStatus() as LabAssignmentStatus)}>
              {getStatusDisplay(getStatus() as LabAssignmentStatus, 'pathology')}
            </Badge>
          </div>

          {/* Patient Info - Main Focus */}
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {getPatientName()}
            </h3>
            <p className="text-sm text-primary font-semibold">
              {getAppointmentFor()}
            </p>
            {data.labBooking && (
              <>
                <p className="text-xs font-semibold text-gray-600">
                  {data.labBooking.address}
                </p>
                <p className="text-xs text-gray-600">
                  {data.labBooking.mobile}
                </p>
              </>
            )}
            {type === 'completed' && data.labBooking && (
              <p className="text-xs text-gray-500 mt-1">
                Payment: {data.labBooking.paymentOption}
              </p>
            )}
          </div>

          {/* Assignment Info */}
          {renderAssignmentInfo()}


          {/* Date & Time with Payment Status */}
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600">
              {dateDisplay.date === 'Date TBD' ? (
                <>
                  <p className="text-gray-500"><b>Date </b>TBD</p>
                  <p className="text-gray-500"><b>Time </b>TBD</p>
                </>
              ) : (
                <>
                  <p className="font-semibold">{dateDisplay.date}</p>
                  <p>{dateDisplay.time}</p>
                </>
              )}
            </div>
            {paymentBadge && (
              <Badge className={`${paymentBadge.isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} text-xs`}>
                {paymentBadge.text}
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          {type === 'upcoming' && renderUpcomingActions()}
          {type === 'ongoing' && renderOngoingActions()}
          {type === 'completed' && renderCompletedActions()}
        </div>
      </CardContent>

      {/* View Reports Modal */}
      <ViewReportsModal
        isOpen={showViewReportsModal}
        onClose={() => setShowViewReportsModal(false)}
        booking={data}
        patientName={getPatientName()}
        existingReports={data.labBooking?.labResult || []}
      />
    </Card>
  );
} 