"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Download, ArrowUpRight, Calendar, LayoutGrid, List, FileText, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StatusUpdateModal from "@/components/pathology/StatusUpdateModal";
import LabBookingUploadModal from "@/components/pathology/LabBookingUploadModal";

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

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);

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
    booking.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  const handleExportCSV = () => {
    const csvContent = [
      ["Booking ID", "Patient Name", "Full Name", "Mobile", "Lab Package", "Status", "Lab Date", "Sample Status", "Assigned Phlebotomist"],
      ...bookings.map(booking => [
        booking.bookingId,
        booking.patientName,
        booking.fullName,
        booking.mobile,
        booking.labPackageName,
        booking.status,
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

  const handleEditBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowStatusModal(true);
  };

  const handleStatusUpdate = () => {
    fetchBookings(); // Refresh data after status update
  };

  const handleViewReport = (booking: Booking) => {
    if (booking.labResult && booking.labResult.length > 0) {
      setSelectedReports(booking.labResult);
      setShowReportsModal(true);
    }
  };

  const closeReportsModal = () => {
    setShowReportsModal(false);
    setSelectedReports([]);
  };

  const handleUploadReport = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowUploadModal(true);
  };

  const handleUploadComplete = () => {
    fetchBookings(); // Refresh data after upload
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Lab Bookings</h1>

      </div>

      {/* Search and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 max-w-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className={`px-3 py-1 ${viewMode === "table" ? "bg-green-600 text-white" : "text-gray-600"}`}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className={`px-3 py-1 ${viewMode === "cards" ? "bg-green-600 text-white" : "text-gray-600"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
       
      </div>

      {/* Bookings Table or Cards */}
      {viewMode === "table" ? (
        <div className="rounded-md border">
          <Table className="text-center bg-white">
            <TableHeader className="bg-custom-mutedgreen text-gray-950">
              <TableRow className="text-center">
                <TableHead className="text-black text-center">
                  <Button variant="ghost" className="text-black">
                    Booking ID
                  </Button>
                </TableHead>
                <TableHead className="text-black text-center">
                  <Button variant="ghost" className="text-black">
                    Patient
                  </Button>
                </TableHead>
                <TableHead className="text-black text-center">
                  <Button variant="ghost" className="text-black">
                    Lab Package
                  </Button>
                </TableHead>
                <TableHead className="text-black text-center">
                  <Button variant="ghost" className="text-black">
                    Date
                  </Button>
                </TableHead>
                <TableHead className="text-black text-center">
                  <Button variant="ghost" className="text-black">
                    Status
                  </Button>
                </TableHead>
                <TableHead className="text-black text-center">
                  <Button variant="ghost" className="text-black">
                    Phlebotomist
                  </Button>
                </TableHead>
                <TableHead className="text-black text-center">Actions</TableHead>
                <TableHead className="text-black text-center">Reports</TableHead>
                <TableHead className="text-black text-center">View</TableHead>
              </TableRow>
            </TableHeader>
              <TableBody>
                {paginatedBookings.map((booking) => (
                  <TableRow key={booking.id} className="text-center hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-500">
                      #{booking.bookingId}
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-bold text-lg text-primary">{booking.patientName}</div>
                        <div className="text-sm text-gray-500">{booking.mobile}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      <div className="text-center">
                        <div className="font-semibold ">{booking.labPackageName}</div>
                        <div className="text-sm text-gray-500">₹{booking.labPackagePrice}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {new Date(booking.labDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        booking.status === "Scheduled" 
                          ? "bg-blue-100 text-blue-800"
                          : booking.status === "COMPLETED"
                          ? "bg-green-100 text-green-800"
                          : booking.status === "CANCELLED"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }>
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {booking.assignedPhlebotomist ? (
                        <span className="text-green-600 font-medium">
                          {booking.assignedPhlebotomist}
                        </span>
                      ) : (
                        <span className="text-gray-500">Not Assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditBooking(booking)}
                          className="text-primary bg-neutral-50/20 font-semibold px-2 py-1"
                        >
                          Update Status
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUploadReport(booking)}
                          className="text-xs px-2 py-1 text-green-600 border-green-600"
                        >
                          Upload Report
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {booking.labResult && booking.labResult.length > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewReport(booking)}
                          className="text-xs px-2 py-1 text-blue-600 hover:text-blue-700"
                        >
                          View Reports ({booking.labResult.length})
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 hover:bg-gray-100"
                        onClick={() => window.location.href = `/pathology/patients/${booking.patientId}`}
                        title="View Patient Details"
                      >
                        <ArrowUpRight className="h-4 w-4 text-gray-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
      ) : (
        /* Card View - Matching Admin Patient Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedBookings.map((booking) => (
            <Card
              key={booking.id}
              className="relative overflow-hidden cursor-pointer border bg-custom-mutedgreen rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <div className="absolute -right-6 -top-6 opacity-10">
                <FileText size={100} />
              </div>
              <div className="relative px-2 z-10 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold text-secondary">#{booking.bookingId}</h3>
                  <Badge className={
                    booking.status === "Scheduled" 
                      ? "bg-slate-500 text-white text-xs"
                      : booking.status === "COMPLETED"
                      ? "bg-green-700 text-white text-xs"
                      : booking.status === "CANCELLED"
                      ? "bg-red-700 text-white text-xs"
                      : "bg-gray-700 text-white text-xs"
                  }>
                    {booking.status}
                  </Badge>
                </div>
                <div className="mt-1 mb-3">
                  <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                    booking.sampleStatus === "Collected" 
                      ? 'bg-green-700 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {booking.sampleStatus}
                  </span>
                </div>
              </div>
              <div className="relative z-10 px-2 pb-4 text-sm text-gray-700">
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
                        onClick={() => handleEditBooking(booking)}
                        className="text-primary  font-semibold flex-1"
                      >
                        Update Status
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUploadReport(booking)}
                        className="text-xs px-2 py-1 text-green-600 border-green-600 flex-1"
                      >
                        Upload Report
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 hover:bg-gray-100"
                        onClick={() => window.location.href = `/pathology/patients/${booking.patientId}`}
                        title="View Patient Details"
                      >
                        <ArrowUpRight className="h-3 w-3 text-gray-600" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      {booking.labResult && booking.labResult.length > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewReport(booking)}
                          className="text-xs px-2 py-1 text-blue-600 hover:text-blue-700"
                        >
                          View Reports ({booking.labResult.length})
                        </Button>
                      )}

                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination - Admin Style */}
      <div className="flex items-center justify-between px-2 mt-6">
        <div className="text-sm text-muted-foreground">
          Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredBookings.length)} of {filteredBookings.length} bookings
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${itemsPerPage}`}
              onValueChange={(value) => {
                const newSize = Number(value);
                setCurrentPage(1); // Reset to first page
                // If you want to make itemsPerPage dynamic, you'd need to make it a state variable
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={itemsPerPage} />
              </SelectTrigger>
              <SelectContent side="top" className="bg-white">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      <StatusUpdateModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        assignment={selectedBooking}
        onStatusUpdate={handleStatusUpdate}
      />

      {/* Upload Reports Modal */}
      <LabBookingUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        assignment={selectedBooking}
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