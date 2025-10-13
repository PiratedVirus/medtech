"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, TestTube, User, Filter, Play, Upload, ChevronLeft, ChevronRight, FileText, Search, Clock } from "lucide-react";
import AssignmentModal from "@/components/pathology/AssignmentModal";
import StatusUpdateModal from "@/components/pathology/StatusUpdateModal";
import ConsolidatedUploadModal from "@/components/pathology/ConsolidatedUploadModal";
import AppointmentCard from "@/components/pathology/AppointmentCard";
import DashboardStatsCard from "@/components/pathology/DashboardStatsCard";
import SectionHeader from "@/components/pathology/SectionHeader";
import EmptyState from "@/components/pathology/EmptyState";
import ScrollableCardsContainer from "@/components/pathology/ScrollableCardsContainer";
import { useProfile } from "@/hooks/context/ProfileContext";
import { format } from "date-fns";
import { toast, ToastContainer } from "react-toastify";
import CdLoader from "@/components/ui/custom/cd-loader";
import { Input } from "@/components/ui/input";

interface Phlebotomist {
  id: number;
  employeeId: string;
  user: {
    name: string;
  };
  isAvailable: boolean;
  currentLocation?: string;
}

interface LabAssignment {
  id: number;
  patient: {
    name: string;
  };
  phlebotomist: {
    user: {
      name: string;
    };
  };
  appointment?: {
    appointmentFor: string;
  };
  labBooking?: {
    id: number;
    labPackageId: number;
    appointmentFor: string;
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
    payment?: {
      id: number;
      amount: number;
      paymentStatus: string;
      paymentMethod?: string;
      currency: string;
    } | null;
  };
  assignedDate: string;
  assignedTime: string;
  status: string;
  sampleCollected: boolean;
}

export default function PathologyDashboard() {
  const { profile } = useProfile();
  const [phlebotomists, setPhlebotomists] = useState<Phlebotomist[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [ongoingAssignments, setOngoingAssignments] = useState<LabAssignment[]>([]);
  const [completedBookings, setCompletedBookings] = useState<LabAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showConsolidatedUploadModal, setShowConsolidatedUploadModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // First, check for time-based movement from upcoming to ongoing
      try {
        await fetch("/api/pathology/check-time-based-movement", {
          method: "POST",
        });
      } catch (error) {
        console.error("Error checking time-based movement:", error);
      }

      // Fetch phlebotomists
      const phlebotomistsResponse = await fetch("/api/pathology/phlebotomists");
      const phlebotomistsData = await phlebotomistsResponse.json();
      setPhlebotomists(phlebotomistsData.phlebotomists || []);

      // Fetch upcoming appointments
      const appointmentsResponse = await fetch("/api/pathology/upcoming-appointments");
      const appointmentsData = await appointmentsResponse.json();
      setUpcomingAppointments(appointmentsData.appointments || []);

      // Fetch ongoing assignments
      const assignmentsResponse = await fetch("/api/pathology/ongoing-assignments");
      const assignmentsData = await assignmentsResponse.json();
      setOngoingAssignments(assignmentsData.assignments || []);

      // Fetch completed bookings
      const completedResponse = await fetch("/api/pathology/completed-bookings");
      const completedData = await completedResponse.json();
      setCompletedBookings(completedData.bookings || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPhlebotomist = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowAssignmentModal(true);
  };

  const handleUpdateStatus = (assignment: any) => {
    setSelectedAssignment(assignment);
    setShowStatusModal(true);
  };

  const handleAssignmentComplete = () => {
    fetchDashboardData();
    toast.success("Phlebotomist assigned successfully!");
  };

  const handleStatusUpdate = () => {
    fetchDashboardData();
    setShowStatusModal(false);
    toast.success("Status updated successfully!");
  };

  const handleStartAppointment = async (appointment: any) => {
    try {
      const assignmentId = appointment.labAssignmentId;

      console.log('Starting appointment:', {
        appointmentId: appointment.id,
        labAssignmentId: appointment.labAssignmentId,
        patientName: appointment.patientName,
        status: appointment.status
      });

      if (!assignmentId) {
        alert('No assignment found for this appointment');
        return;
      }

      const response = await fetch(`/api/pathology/lab-assignments/${assignmentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'PHLEBOTOMIST_LEFT',
        }),
      });

      if (response.ok) {
        fetchDashboardData();
        toast.success('Appointment started successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to start appointment');
      }
    } catch (error) {
      console.error('Error starting appointment:', error);
      alert('Error starting appointment');
    }
  };

  const handleUploadReports = (assignment: any) => {
    // Transform assignment data to match the format expected by ConsolidatedUploadModal
    const bookingData = {
      id: assignment.labBooking?.id || assignment.id,
      labPackageName: assignment.labBooking?.labPackage?.name || assignment.appointment?.appointmentFor || 'Lab Test',
      date: assignment.assignedDate || assignment.labBooking?.labDate,
      status: assignment.status,
      labAssignmentId: assignment.id,
      patient: assignment.patient,
      labBooking: assignment.labBooking
    };
    
    setSelectedBooking(bookingData);
    setShowConsolidatedUploadModal(true);
  };

  const handleViewReports = (assignment: any) => {
    if (assignment.labBooking?.labResult && assignment.labBooking.labResult.length > 0) {
      assignment.labBooking.labResult.forEach((url: string) => {
        window.open(url, '_blank');
      });
    }
  };

  const scrollUpcoming = (direction: 'left' | 'right') => {
    const containers = document.querySelectorAll('[id^="upcoming-scroll"]');
    containers.forEach(container => {
      if (container) {
        const scrollAmount = 300;
        const currentPosition = container.scrollLeft;
        const newPosition = direction === 'left'
          ? Math.max(0, currentPosition - scrollAmount)
          : currentPosition + scrollAmount;

        container.scrollTo({ left: newPosition, behavior: 'smooth' });
      }
    });
  };

  const scrollOngoing = (direction: 'left' | 'right') => {
    const containers = document.querySelectorAll('[id^="ongoing-scroll"]');
    containers.forEach(container => {
      if (container) {
        const scrollAmount = 300;
        const currentPosition = container.scrollLeft;
        const newPosition = direction === 'left'
          ? Math.max(0, currentPosition - scrollAmount)
          : currentPosition + scrollAmount;

        container.scrollTo({ left: newPosition, behavior: 'smooth' });
      }
    });
  };

  const scrollCompleted = (direction: 'left' | 'right') => {
    const containers = document.querySelectorAll('[id^="completed-scroll"]');
    containers.forEach(container => {
      if (container) {
        const scrollAmount = 300;
        const currentPosition = container.scrollLeft;
        const newPosition = direction === 'left'
          ? Math.max(0, currentPosition - scrollAmount)
          : currentPosition + scrollAmount;

        container.scrollTo({ left: newPosition, behavior: 'smooth' });
      }
    });
  };

  // Filter appointments based on assignment status and search query
  const filteredAppointments = upcomingAppointments.filter(appointment => {
    const matchesStatus = filterStatus === 'all' ? true :
      filterStatus === 'assigned' ? appointment.assignedPhlebotomist :
        !appointment.assignedPhlebotomist;

    const matchesSearch = searchQuery === "" ||
      appointment.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.appointmentFor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.assignedPhlebotomist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.id?.toString().includes(searchQuery);

    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return <CdLoader />;
  }

  const upcomingStats = {
    total: upcomingAppointments.length,
    assigned: upcomingAppointments.filter(a => a.assignedPhlebotomist).length,
    unassigned: upcomingAppointments.filter(a => !a.assignedPhlebotomist).length
  };

  return (
    <>
      <ToastContainer />
      <div className="mx-20 px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">
            {(() => {
              const hour = new Date().getHours();
              const name = profile?.name || "there";
              if (hour < 12) return `Good Morning, ${name}!`;
              if (hour < 18) return `Good Afternoon, ${name}!`;
              return `Good Evening, ${name}!`;
            })()}
          </h1>
          <div className="text-sm text-gray-600">
            {format(new Date(), "dd-MM-yyyy | h:mm a")} <Calendar className="inline ml-1 h-4 w-4" />
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by patient name, test type, phlebotomist, or booking ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'assigned' | 'unassigned')}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Appointments</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardStatsCard
            title="Total Appointments"
            value={upcomingAppointments.length}
            icon={Calendar}
          />
          <DashboardStatsCard
            title="Assigned"
            value={upcomingAppointments.filter(a => a.assignedPhlebotomist).length}
            icon={User}
          />
          <DashboardStatsCard
            title="Unassigned"
            value={upcomingAppointments.filter(a => !a.assignedPhlebotomist).length}
            icon={Clock}
          />
          <DashboardStatsCard
            title="Phlebotomists"
            value={phlebotomists.length}
            icon={Users}
          />
        </div>

        {/* Upcoming Appointments */}
        <Card className="bg-white">
          <SectionHeader
            title="Upcoming Appointments"
            showFilters={true}
            showScrollControls={true}
            filterStatus={filterStatus}
            onFilterChange={setFilterStatus}
            onScroll={scrollUpcoming}
            stats={upcomingStats}
          />
          <CardContent>
            <div className="space-y-4">
              {filteredAppointments.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No appointments found for the selected filter."
                />
              ) : (
                <>
                  {/* First Row */}
                  <ScrollableCardsContainer id="upcoming-scroll-1">
                    {filteredAppointments.slice(0, Math.ceil(filteredAppointments.length / 2)).map((appointment, index) => (
                      <AppointmentCard
                        key={index}
                        type="upcoming"
                        data={appointment}
                        onAssignPhlebotomist={handleAssignPhlebotomist}
                        onStartAppointment={handleStartAppointment}
                      />
                    ))}
                  </ScrollableCardsContainer>

                  {/* Second Row */}
                  {filteredAppointments.length > Math.ceil(filteredAppointments.length / 2) && (
                    <ScrollableCardsContainer id="upcoming-scroll-2">
                      {filteredAppointments.slice(Math.ceil(filteredAppointments.length / 2)).map((appointment, index) => (
                        <AppointmentCard
                          key={index + Math.ceil(filteredAppointments.length / 2)}
                          type="upcoming"
                          data={appointment}
                          onAssignPhlebotomist={handleAssignPhlebotomist}
                          onStartAppointment={handleStartAppointment}
                        />
                      ))}
                    </ScrollableCardsContainer>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Currently Ongoing Assignments */}
        <Card className="bg-white">
          <SectionHeader
            title="Currently Ongoing Assignments"
            showDate={true}
            showScrollControls={true}
            onScroll={scrollOngoing}
          />
          <CardContent>
            <div className="space-y-4">
              {ongoingAssignments.length === 0 ? (
                <EmptyState
                  icon={TestTube}
                  title="No ongoing assignments found."
                />
              ) : (
                <>
                  {/* First Row */}
                  <ScrollableCardsContainer id="ongoing-scroll-1">
                    {ongoingAssignments.slice(0, Math.ceil(ongoingAssignments.length / 2)).map((assignment) => (
                      <AppointmentCard
                        key={assignment.id}
                        type="ongoing"
                        data={assignment}
                        onUpdateStatus={handleUpdateStatus}
                        onUploadReports={handleUploadReports}
                        onViewReports={handleViewReports}
                      />
                    ))}
                  </ScrollableCardsContainer>

                  {/* Second Row */}
                  {ongoingAssignments.length > Math.ceil(ongoingAssignments.length / 2) && (
                    <ScrollableCardsContainer id="ongoing-scroll-2">
                      {ongoingAssignments.slice(Math.ceil(ongoingAssignments.length / 2)).map((assignment) => (
                        <AppointmentCard
                          key={assignment.id}
                          type="ongoing"
                          data={assignment}
                          onUpdateStatus={handleUpdateStatus}
                          onUploadReports={handleUploadReports}
                          onViewReports={handleViewReports}
                        />
                      ))}
                    </ScrollableCardsContainer>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Completed Bookings */}
        <Card className="bg-white">
          <SectionHeader
            title="Completed Bookings"
            showDate={true}
            showScrollControls={true}
            onScroll={scrollCompleted}
          />
          <CardContent>
            <div className="space-y-4">
              {completedBookings.length === 0 ? (
                <EmptyState
                  icon={TestTube}
                  title="No completed bookings found."
                />
              ) : (
                <>
                  {/* First Row */}
                  <ScrollableCardsContainer id="completed-scroll-1">
                    {completedBookings.slice(0, Math.ceil(completedBookings.length / 2)).map((booking) => (
                      <AppointmentCard
                        key={booking.id}
                        type="completed"
                        data={booking}
                        onUpdateStatus={handleUpdateStatus}
                        onUploadReports={handleUploadReports}
                        onViewReports={handleViewReports}
                      />
                    ))}
                  </ScrollableCardsContainer>

                  {/* Second Row */}
                  {completedBookings.length > Math.ceil(completedBookings.length / 2) && (
                    <ScrollableCardsContainer id="completed-scroll-2">
                      {completedBookings.slice(Math.ceil(completedBookings.length / 2)).map((booking) => (
                        <AppointmentCard
                          key={booking.id}
                          type="completed"
                          data={booking}
                          onUpdateStatus={handleUpdateStatus}
                          onUploadReports={handleUploadReports}
                          onViewReports={handleViewReports}
                        />
                      ))}
                    </ScrollableCardsContainer>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Modals */}
        <AssignmentModal
          isOpen={showAssignmentModal}
          onClose={() => setShowAssignmentModal(false)}
          appointment={selectedAppointment}
          onAssignmentComplete={handleAssignmentComplete}
        />

        <StatusUpdateModal
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          assignment={selectedAssignment}
          onStatusUpdate={handleStatusUpdate}
        />

        <ConsolidatedUploadModal
          isOpen={showConsolidatedUploadModal}
          onClose={() => setShowConsolidatedUploadModal(false)}
          booking={selectedBooking}
          patientName={selectedBooking?.patient?.name || selectedBooking?.labBooking?.fullName || 'Patient'}
          onUploadComplete={() => {
            setShowConsolidatedUploadModal(false);
            fetchDashboardData();
          }}
        />
      </div>
    </>
  );
} 