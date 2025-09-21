"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { FileText, ArrowUpRight, Search, Download, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import StatusUpdateModal from "@/components/pathology/StatusUpdateModal";
import ConsolidatedUploadModal from "@/components/pathology/ConsolidatedUploadModal";
import { normalizeStatus } from "@/lib/utils/status";

interface Booking {
  id: number;
  bookingId: number;
  patientId: number;
  patientName: string;
  fullName: string;
  mobile: string;
  email: string;
  address: string;
  labPackageName: string;
  labPackagePrice: number;
  paymentOption: string;
  status: string;
  pathologyStatus: string;
  labDate: string;
  sampleStatus: string;
  assignedPhlebotomist: string | null;
  assignmentStatus: string;
  createdAt: string;
  labResult?: string[];
}

export function AllLabBookingsCard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch("/api/pathology/bookings");
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(booking =>
    booking.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.mobile.includes(searchQuery) ||
    booking.labPackageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    normalizeStatus(booking.status).includes(normalizeStatus(searchQuery))
  );

  const handleCardClick = (booking: Booking) => {
    router.push(`/pathology/patients/${booking.patientId}`);
  };

  const handleEditBooking = (e: React.MouseEvent, booking: Booking) => {
    e.stopPropagation();
    setSelectedBooking(booking);
    setShowStatusModal(true);
  };

  const handleStatusUpdate = () => {
    fetchBookings(); // Refresh data after status update
  };

  const handleViewReport = (e: React.MouseEvent, booking: Booking) => {
    e.stopPropagation();
    if (booking.labResult && booking.labResult.length > 0) {
      setSelectedReports(booking.labResult);
      setShowReportsModal(true);
    }
  };

  const closeReportsModal = () => {
    setShowReportsModal(false);
    setSelectedReports([]);
  };

  const handleUploadReport = (e: React.MouseEvent, booking: Booking) => {
    e.stopPropagation();
    setSelectedBooking(booking);
    setShowUploadModal(true);
  };

  const handleUploadComplete = () => {
    fetchBookings(); // Refresh data after upload
  };

  const handleExportCSV = () => {
    const csvContent = [
      ["Booking ID", "Patient Name", "Full Name", "Mobile", "Lab Package", "Status", "Lab Date", "Sample Status", "Assigned Phlebotomist"],
      ...bookings.map(booking => [
        booking.bookingId,
        booking.patientName,
        booking.fullName,
        booking.mobile,
        booking.labPackageName,
        normalizeStatus(booking.status),
        new Date(booking.labDate).toLocaleDateString(),
        booking.sampleStatus,
        booking.assignedPhlebotomist || "Not Assigned"
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lab-bookings.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Export */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search bookings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 max-w-sm"
          />
        </div>
        <Button
          onClick={handleExportCSV}
          variant="outline"
          size="sm"
          className="bg-gray-100 hover:bg-gray-200 text-gray-700"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Bookings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredBookings.map((booking) => (
          <Card
            key={booking.id}
            onClick={() => handleCardClick(booking)}
            className="relative overflow-hidden cursor-pointer border bg-custom-mutedgreen rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
          >
            <div className="absolute -right-6 -top-6 opacity-10">
              <FileText size={100} />
            </div>
            <CardHeader className="relative px-2 z-10">
              <CardTitle className="text-xl font-semibold text-secondary">#{booking.bookingId}</CardTitle>
              <div className="mt-1">
                <Badge className={
                  normalizeStatus(booking.status) === "SCHEDULED" 
                    ? "bg-slate-500 text-white text-xs"
                    : normalizeStatus(booking.status) === "COMPLETED"
                    ? "bg-green-700 text-white text-xs"
                    : normalizeStatus(booking.status) === "CANCELLED"
                    ? "bg-red-700 text-white text-xs"
                    : "bg-gray-700 text-white text-xs"
                }>
                  {normalizeStatus(booking.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="relative z-10 px-2 text-sm text-gray-700">
              <div className="space-y-1">
                <div className="flex items-center justify-between font-semibold">
                  <span>{booking.patientName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{booking.mobile}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>{booking.labPackageName}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>₹{booking.labPackagePrice}</span>
                  <span>{new Date(booking.labDate).toLocaleDateString()}</span>
                </div>
                <div className="text-xs">
                  <span className="font-medium">Phlebotomist: </span>
                  <span className={booking.assignedPhlebotomist ? "text-green-600" : "text-gray-500"}>
                    {booking.assignedPhlebotomist || "Not Assigned"}
                  </span>
                </div>
                
                {/* Action Buttons */}
                <div className="pt-2 mt-2 border-t border-gray-200 space-y-2">
                  <div className="flex items-center gap-1 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => handleEditBooking(e, booking)}
                      className="text-primary font-semibold flex-1 text-xs px-2 py-1"
                    >
                      Update Status
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => handleUploadReport(e, booking)}
                      className="text-xs px-2 py-1 text-green-600 hover:text-green-700 flex-1"
                    >
                      Upload Report
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    {booking.labResult && booking.labResult.length > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleViewReport(e, booking)}
                        className="text-xs px-2 py-1 text-blue-600 hover:text-blue-700"
                      >
                        View Reports ({booking.labResult.length})
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 hover:bg-gray-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick(booking);
                      }}
                      title="View Patient Details"
                    >
                      <ArrowUpRight className="h-3 w-3 text-gray-600" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Update Modal */}
      <StatusUpdateModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        assignment={selectedBooking}
        onStatusUpdate={handleStatusUpdate}
      />

      {/* Upload Reports Modal */}
      <ConsolidatedUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        booking={selectedBooking}
        patientName={selectedBooking?.patientName || selectedBooking?.fullName || 'Patient'}
        onUploadComplete={handleUploadComplete}
      />

      {/* Reports Modal */}
      {showReportsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Lab Reports</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeReportsModal}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {selectedReports.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No reports available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedReports.map((report, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium text-gray-900">
                            Report {index + 1}
                          </p>
                          <p className="text-sm text-gray-500">
                            {report.split('/').pop() || 'Lab Report'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(report, '_blank')}
                        className="text-primary border-primary/20 hover:bg-primary/10"
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end p-6 border-t">
              <Button
                variant="outline"
                onClick={closeReportsModal}
                className="mr-2"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 