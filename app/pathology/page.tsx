"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, TestTube, User, MapPin, Filter, Play, Upload, ChevronLeft, ChevronRight } from "lucide-react";
import AssignmentModal from "@/components/pathology/AssignmentModal";
import StatusUpdateModal from "@/components/pathology/StatusUpdateModal";
import LabReportUpload from "@/components/pathology/LabReportUpload";
import LabBookingUploadModal from "@/components/pathology/LabBookingUploadModal";
import { useProfile } from "@/hooks/context/ProfileContext";
import { format } from "date-fns";
import { toast, ToastContainer } from "react-toastify";

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
    pathologyStatus: string;
    labDate: string;
    labResult: string[];
    labPackage: {
      id: number;
      name: string;
      price: number;
    };
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
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLabBookingUploadModal, setShowLabBookingUploadModal] = useState(false);
  const [upcomingScrollPosition, setUpcomingScrollPosition] = useState(0);
  const [ongoingScrollPosition, setOngoingScrollPosition] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
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
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
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
  };

  const handleStatusUpdate = () => {
    fetchDashboardData();
  };

  const handleStartAppointment = async (appointment: any) => {
    try {
      // Find first available phlebotomist
      const availablePhlebotomist = phlebotomists.find(p => p.isAvailable);
      
      if (!availablePhlebotomist) {
        alert('No available phlebotomists at the moment. Please assign one manually.');
        return;
      }

      // Auto-assign to first available phlebotomist and move to ongoing
      const response = await fetch('/api/pathology/assign-phlebotomist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: appointment.patientId,
          appointmentId: appointment.id,
          phlebotomistId: availablePhlebotomist.id,
          assignedDate: new Date().toISOString().split('T')[0],
          assignedTime: new Date().toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
        }),
      });

      if (response.ok) {
        fetchDashboardData(); // Refresh data
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
    setSelectedAssignment(assignment);
    setShowLabBookingUploadModal(true);
  };

  const scrollUpcoming = (direction: 'left' | 'right') => {
    const container = document.getElementById('upcoming-scroll');
    if (container) {
      const scrollAmount = 300;
      const newPosition = direction === 'left' 
        ? Math.max(0, upcomingScrollPosition - scrollAmount)
        : upcomingScrollPosition + scrollAmount;
      
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setUpcomingScrollPosition(newPosition);
    }
  };

  const scrollOngoing = (direction: 'left' | 'right') => {
    const container = document.getElementById('ongoing-scroll');
    if (container) {
      const scrollAmount = 300;
      const newPosition = direction === 'left' 
        ? Math.max(0, ongoingScrollPosition - scrollAmount)
        : ongoingScrollPosition + scrollAmount;
      
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setOngoingScrollPosition(newPosition);
    }
  };

  // Filter appointments based on assignment status
  const filteredAppointments = upcomingAppointments.filter(appointment => {
    if (filterStatus === 'assigned') {
      return appointment.assignedPhlebotomist;
    } else if (filterStatus === 'unassigned') {
      return !appointment.assignedPhlebotomist;
    }
    return true; // 'all'
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

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

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Appointments */}
        <Card className="relative overflow-hidden bg-gradient-to-tr from-[#1e5636] to-[#2e8b57] border-none shadow-lg">
          <div className="absolute left-0 right-0 bottom-0 top-0 z-0" style={{background: 'radial-gradient(ellipse at 60% 70%, #56A67C55 40%, transparent 80%)'}} />
          <CardContent className="relative z-10 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-full">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white/90">Total Appointments</h2>
                  <p className="text-3xl font-bold text-white">{upcomingAppointments.length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assigned Appointments */}
        <Card className="relative overflow-hidden bg-gradient-to-tr from-[#1e5636] to-[#2e8b57] border-none shadow-lg">
          <div className="absolute left-0 right-0 bottom-0 top-0 z-0" style={{background: 'radial-gradient(ellipse at 60% 70%, #56A67C55 40%, transparent 80%)'}} />
          <CardContent className="relative z-10 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-full">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white/90">Assigned</h2>
                  <p className="text-3xl font-bold text-white">{upcomingAppointments.filter(a => a.assignedPhlebotomist).length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unassigned Appointments */}
        <Card className="relative overflow-hidden bg-gradient-to-tr from-[#1e5636] to-[#2e8b57] border-none shadow-lg">
          <div className="absolute left-0 right-0 bottom-0 top-0 z-0" style={{background: 'radial-gradient(ellipse at 60% 70%, #56A67C55 40%, transparent 80%)'}} />
          <CardContent className="relative z-10 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-full">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white/90">Unassigned</h2>
                  <p className="text-3xl font-bold text-white">{upcomingAppointments.filter(a => !a.assignedPhlebotomist).length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Phlebotomists */}
        <Card className="relative overflow-hidden bg-gradient-to-tr from-[#1e5636] to-[#2e8b57] border-none shadow-lg">
          <div className="absolute left-0 right-0 bottom-0 top-0 z-0" style={{background: 'radial-gradient(ellipse at 60% 70%, #56A67C55 40%, transparent 80%)'}} />
          <CardContent className="relative z-10 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-full">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white/90">Phlebotomists</h2>
                  <p className="text-3xl font-bold text-white">{phlebotomists.length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>



              {/* Upcoming Appointments with Horizontal Scroll */}
        <Card className="bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-800">
                Upcoming Appointments
              </CardTitle>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Button
                    variant={filterStatus === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('all')}
                    className={`${filterStatus === 'all' ? 'bg-primary text-white' : 'text-gray-600'} flex items-center space-x-1`}
                  >
                    <Filter className="h-4 w-4" />
                    <span>All ({upcomingAppointments.length})</span>
                  </Button>
                  <Button
                    variant={filterStatus === 'assigned' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('assigned')}
                    className={`${filterStatus === 'assigned' ? 'bg-green-600 text-white' : 'text-gray-600'} flex items-center space-x-1`}
                  >
                    <User className="h-4 w-4" />
                    <span>Assigned ({upcomingAppointments.filter(a => a.assignedPhlebotomist).length})</span>
                  </Button>
                  <Button
                    variant={filterStatus === 'unassigned' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('unassigned')}
                    className={`${filterStatus === 'unassigned' ? 'bg-orange-600 text-white' : 'text-gray-600'} flex items-center space-x-1`}
                  >
                    <Clock className="h-4 w-4" />
                    <span>Unassigned ({upcomingAppointments.filter(a => !a.assignedPhlebotomist).length})</span>
                  </Button>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => scrollUpcoming('left')}
                    className="p-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => scrollUpcoming('right')}
                    className="p-2"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No appointments found for the selected filter.</p>
                </div>
              ) : (
                <>
                  {/* First Row */}
                  <div className="relative">
                    <div
                      id="upcoming-scroll"
                      className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {filteredAppointments.slice(0, Math.ceil(filteredAppointments.length / 2)).map((appointment, index) => (
                        <Card key={index} className="bg-custom-mutedgreen flex-shrink-0 w-80 hover:shadow-md transition-shadow duration-200">
                          <CardContent className="p-5">
                            <div className="space-y-4">
                              {/* Patient Info - Main Focus */}
                              <div className="text-center">
                                <h3 className="text-lg font-bold text-gray-900 mb-1">
                                  {appointment.patientName || `Patient ${index + 1}`}
                                </h3>
                                <p className="text-sm text-primary font-semibold">
                                  {appointment.appointmentFor || 'Lab Test'}
                                </p>
                              </div>

                              {/* Assignment Info */}
                              {appointment.assignedPhlebotomist ? (
                                <div className="bg-green-50 rounded-lg p-3 text-center">
                                  <p className="text-xs text-gray-600 mb-1">Assigned Phlebotomist</p>
                                  <p className="font-semibold text-green-700">
                                    {appointment.assignedPhlebotomist}
                                  </p>
                                </div>
                              ) : (
                                <div className="bg-orange-50 rounded-lg p-3 text-center">
                                  <p className="text-xs text-gray-600 mb-1">Status</p>
                                  <p className="font-semibold text-orange-700">
                                    Awaiting Assignment
                                  </p>
                                </div>
                              )}

                              {/* Date & Status */}
                              <div className="flex items-center justify-between text-sm">
                                <div className="text-gray-600">
                                  <p className="font-semibold">{appointment.appointmentDate}</p>
                                  <p>{appointment.startTime || 'TBD'}</p>
                                </div>
                                <Badge className={
                                  appointment.assignedPhlebotomist
                                    ? "bg-green-100 text-green-800"
                                    : "bg-orange-100 text-orange-800"
                                }>
                                  {appointment.assignedPhlebotomist ? "Ready" : "Pending"}
                                </Badge>
                              </div>

                              {/* Action Button */}
                              {appointment.assignedPhlebotomist ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
                                  onClick={() => handleStartAppointment(appointment)}
                                >
                                  {/* <Play className="h-4 w-4" /> */}
                                  <span>Start Appointment</span>
                                </Button>
                              ) : (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="w-full font-semibold"
                                  onClick={() => handleAssignPhlebotomist(appointment)}
                                >
                                  Assign Phlebotomist
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Second Row */}
                  {filteredAppointments.length > Math.ceil(filteredAppointments.length / 2) && (
                    <div className="relative">
                      <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2">
                        {filteredAppointments.slice(Math.ceil(filteredAppointments.length / 2)).map((appointment, index) => (
                          <Card key={index + Math.ceil(filteredAppointments.length / 2)} className="bg-custom-mutedgreen flex-shrink-0 w-80 hover:shadow-md transition-shadow duration-200">
                            <CardContent className="p-5">
                              <div className="space-y-4">
                                {/* Patient Info - Main Focus */}
                                <div className="text-center">
                                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                                    {appointment.patientName || `Patient ${index + Math.ceil(filteredAppointments.length / 2) + 1}`}
                                  </h3>
                                  <p className="text-sm text-primary font-semibold">
                                    {appointment.appointmentFor || 'Lab Test'}
                                  </p>
                                </div>

                                {/* Assignment Info */}
                                {appointment.assignedPhlebotomist ? (
                                  <div className="bg-green-50 rounded-lg p-3 text-center">
                                    <p className="text-xs text-gray-600 mb-1">Assigned Phlebotomist</p>
                                    <p className="font-semibold text-green-700">
                                      {appointment.assignedPhlebotomist}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="bg-orange-50 rounded-lg p-3 text-center">
                                    <p className="text-xs text-gray-600 mb-1">Status</p>
                                    <p className="font-semibold text-orange-700">
                                      Awaiting Assignment
                                    </p>
                                  </div>
                                )}

                                {/* Date & Status */}
                                <div className="flex items-center justify-between text-sm">
                                  <div className="text-gray-600">
                                    <p className="font-semibold">{appointment.appointmentDate}</p>
                                    <p>{appointment.startTime || 'TBD'}</p>
                                  </div>
                                  <Badge className={
                                    appointment.assignedPhlebotomist
                                      ? "bg-green-100 text-green-800"
                                      : "bg-orange-100 text-orange-800"
                                  }>
                                    {appointment.assignedPhlebotomist ? "Ready" : "Pending"}
                                  </Badge>
                                </div>

                                {/* Action Button */}
                                {appointment.assignedPhlebotomist ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
                                    onClick={() => handleStartAppointment(appointment)}
                                  >
                                    {/* <Play className="h-4 w-4" /> */}
                                    <span>Start Appointment</span>
                                  </Button>
                                ) : (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="w-full font-semibold"
                                    onClick={() => handleAssignPhlebotomist(appointment)}
                                  >
                                    Assign Phlebotomist
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

              {/* Currently Ongoing Assignments with Horizontal Scroll */}
        <Card className="bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-800">Currently Ongoing Assignments</CardTitle>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-lg">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800">{format(new Date(), "dd-MM-yyyy")}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => scrollOngoing('left')}
                    className="p-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => scrollOngoing('right')}
                    className="p-2"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ongoingAssignments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TestTube className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No ongoing assignments found.</p>
                </div>
              ) : (
                <>
                  {/* First Row */}
                  <div className="relative">
                    <div
                      id="ongoing-scroll"
                      className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {ongoingAssignments.slice(0, Math.ceil(ongoingAssignments.length / 2)).map((assignment) => (
                        <Card key={assignment.id} className="bg-custom-mutedgreen flex-shrink-0 w-80 hover:shadow-md transition-shadow duration-200">
                          <CardContent className="p-5">
                            <div className="space-y-4">
                              {/* Patient Info - Main Focus */}
                              <div className="text-center">
                                <h3 className="text-lg font-bold text-gray-900 mb-1">
                                  {assignment.patient?.name || 'Unknown Patient'}
                                </h3>
                                <p className="text-sm text-primary font-semibold">
                                  {assignment.labBooking?.labPackage?.name || assignment.appointment?.appointmentFor || 'Lab Test'}
                                </p>
                                {assignment.labBooking && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Payment: {assignment.labBooking.paymentOption}
                                  </p>
                                )}
                              </div>

                              {/* Lab Booking Info */}
                              {assignment.labBooking && (
                                <div className="bg-blue-50 rounded-lg p-3 text-center">
                                  <p className="text-xs text-gray-600 mb-1">Lab Booking Details</p>
                                  <p className="font-semibold text-blue-700 text-sm">
                                    {assignment.labBooking.fullName || assignment.patient?.name}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {assignment.labBooking.mobile} • {assignment.labBooking.address}
                                  </p>
                                </div>
                              )}

                              {/* Phlebotomist Info */}
                              <div className="bg-green-50 rounded-lg p-3 text-center">
                                <p className="text-xs text-gray-600 mb-1">Assigned Phlebotomist</p>
                                <p className="font-semibold text-green-700">
                                  {assignment.phlebotomist?.user?.name || 'Phlebotomist'}
                                </p>
                              </div>

                              {/* Date & Status */}
                              <div className="flex items-center justify-between text-sm">
                                <div className="text-gray-600">
                                  <p className="font-semibold">
                                    {assignment.assignedDate 
                                      ? format(new Date(assignment.assignedDate), "dd-MMM-yyyy")
                                      : 'Date TBD'
                                    }
                                  </p>
                                  <p>{assignment.assignedTime}</p>
                                </div>
                                <Badge className={`${
                                  assignment.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-800' :
                                  assignment.status === 'PHLEBOTOMIST_LEFT' ? 'bg-yellow-100 text-yellow-800' :
                                  assignment.status === 'SAMPLE_COLLECTED' ? 'bg-green-100 text-green-800' :
                                  assignment.status === 'IN_LAB' ? 'bg-indigo-100 text-indigo-800' :
                                  assignment.status === 'ANALYZING' ? 'bg-orange-100 text-orange-800' :
                                  assignment.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                                  'bg-gray-100 text-gray-800'
                                } text-xs`}>
                                  {assignment.status.replace('_', ' ')}
                                </Badge>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 text-primary font-semibold"
                                  onClick={() => handleUpdateStatus(assignment)}
                                >
                                  Update Status
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 text-purple-600 border-purple-200 hover:bg-purple-50 flex items-center space-x-2"
                                  onClick={() => handleUploadReports(assignment)}
                                >
                                  <Upload className="h-4 w-4" />
                                  <span>Upload Reports</span>
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Second Row */}
                  {ongoingAssignments.length > Math.ceil(ongoingAssignments.length / 2) && (
                    <div className="relative">
                      <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2">
                        {ongoingAssignments.slice(Math.ceil(ongoingAssignments.length / 2)).map((assignment) => (
                          <Card key={assignment.id} className="bg-custom-mutedgreen flex-shrink-0 w-80 hover:shadow-md transition-shadow duration-200">
                            <CardContent className="p-5">
                              <div className="space-y-4">
                                {/* Patient Info - Main Focus */}
                                <div className="text-center">
                                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                                    {assignment.patient?.name || 'Unknown Patient'}
                                  </h3>
                                  <p className="text-sm text-primary font-semibold">
                                    {assignment.labBooking?.labPackage?.name || assignment.appointment?.appointmentFor || 'Lab Test'}
                                  </p>
                                </div>

                                {/* Lab Booking Info */}
                                {assignment.labBooking && (
                                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                                    <p className="text-xs text-gray-600 mb-1">Lab Booking Details</p>
                                    <p className="font-semibold text-blue-700 text-sm">
                                      {assignment.labBooking.fullName || assignment.patient?.name}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      {assignment.labBooking.mobile} • {assignment.labBooking.address}
                                    </p>
                                  </div>
                                )}

                                {/* Phlebotomist Info */}
                                <div className="bg-green-50 rounded-lg p-3 text-center">
                                  <p className="text-xs text-gray-600 mb-1">Assigned Phlebotomist</p>
                                  <p className="font-semibold text-green-700">
                                    {assignment.phlebotomist?.user?.name || 'Phlebotomist'}
                                  </p>
                                </div>

                                {/* Date & Status */}
                                <div className="flex items-center justify-between text-sm">
                                  <div className="text-gray-600">
                                    <p className="font-semibold">
                                      {assignment.assignedDate 
                                        ? format(new Date(assignment.assignedDate), "dd-MMM-yyyy")
                                        : 'Date TBD'
                                      }
                                    </p>
                                    <p>{assignment.assignedTime}</p>
                                  </div>
                                  <Badge className={`${
                                    assignment.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-800' :
                                    assignment.status === 'PHLEBOTOMIST_LEFT' ? 'bg-yellow-100 text-yellow-800' :
                                    assignment.status === 'SAMPLE_COLLECTED' ? 'bg-green-100 text-green-800' :
                                    assignment.status === 'IN_LAB' ? 'bg-indigo-100 text-indigo-800' :
                                    assignment.status === 'ANALYZING' ? 'bg-orange-100 text-orange-800' :
                                    assignment.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                                    'bg-gray-100 text-gray-800'
                                  } text-xs`}>
                                    {assignment.status.replace('_', ' ')}
                                  </Badge>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-primary font-semibold"
                                    onClick={() => handleUpdateStatus(assignment)}
                                  >
                                    Update Status
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-purple-600 border-purple-200 hover:bg-purple-50 flex items-center space-x-2"
                                    onClick={() => handleUploadReports(assignment)}
                                  >
                                    <Upload className="h-4 w-4" />
                                    <span>Upload Reports</span>
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

      {/* Assignment Modal */}
      <AssignmentModal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        appointment={selectedAppointment}
        onAssignmentComplete={handleAssignmentComplete}
      />

      {/* Status Update Modal */}
      <StatusUpdateModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        assignment={selectedAssignment}
        onStatusUpdate={handleStatusUpdate}
      />

      {/* Upload Reports Modal */}
      <LabReportUpload
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        assignment={selectedAssignment}
        onUploadComplete={() => {
          setShowUploadModal(false);
          fetchDashboardData();
        }}
      />

      {/* Lab Booking Upload Modal */}
      <LabBookingUploadModal
        isOpen={showLabBookingUploadModal}
        onClose={() => setShowLabBookingUploadModal(false)}
        assignment={selectedAssignment}
        onUploadComplete={() => {
          setShowLabBookingUploadModal(false);
          fetchDashboardData();
        }}
      />
    </div>
    </>
  );
} 