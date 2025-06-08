"use client";

import { useEffect, useState } from "react";
import { useDecryptedProfile } from "@/hooks/use-profile";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Video, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import CdLoader from "@/components/ui/custom/cd-loader";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Appointment {
  id: number;
  patient: {
    id: number;
    name: string;
    phoneNumber: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  consultationType: "video" | "in-person";
  meetingRoomLink?: string | null;
  prescriptionLink?: string | null;
  payment?: {
    amount: number;
    status: string;
  } | null;
}

export default function AppointmentsPage() {
  const { profile, isDoctor, isLoading: profileLoading } = useDecryptedProfile();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [prescriptionNotes, setPrescriptionNotes] = useState("");
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchAppointments();
  }, [activeTab]);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(`/api/doctor/appointments/manage?type=${activeTab}`);
      if (response.data) {
        setAppointments(response.data);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to load appointments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinMeeting = (meetingRoomLink: string) => {
    window.open(meetingRoomLink, "_blank");
  };

  const handleViewPatient = (patientId: number) => {
    router.push(`/doctor/patients/${patientId}`);
  };

  const handleStatusChange = async (appointmentId: number, newStatus: Appointment["status"]) => {
    try {
      await axios.put("/api/doctor/appointments/manage?action=status", {
        appointmentId,
        status: newStatus,
      });
      toast.success("Appointment status updated");
      fetchAppointments();
    } catch (error) {
      console.error("Error updating appointment status:", error);
      toast.error("Failed to update appointment status");
    }
  };

  const handleUploadPrescription = async () => {
    if (!selectedAppointment || !prescriptionNotes) {
      toast.error("Please provide prescription notes");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("appointmentId", selectedAppointment.id.toString());
      formData.append("notes", prescriptionNotes);
      if (prescriptionFile) {
        formData.append("file", prescriptionFile);
      }

      const response = await axios.post(
        "/api/doctor/appointments/manage?action=prescription",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.prescriptionLink) {
        toast.success("Prescription uploaded successfully");
        setSelectedAppointment(null);
        setPrescriptionNotes("");
        setPrescriptionFile(null);
        fetchAppointments();
      } else {
        toast.error("Failed to upload prescription");
      }
    } catch (error) {
      console.error("Error uploading prescription:", error);
      toast.error("Failed to upload prescription");
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      CONFIRMED: { color: "bg-blue-100 text-blue-800", icon: CheckCircle },
      COMPLETED: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      CANCELLED: { color: "bg-red-100 text-red-800", icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  if (profileLoading || isLoading) {
    return <CdLoader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardContent className="p-6">
              {appointments.length > 0 ? (
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 bg-white rounded-lg border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium">{appointment.patient.name}</h3>
                              {getStatusBadge(appointment.status)}
                            </div>
                            <p className="text-sm text-gray-500">
                              {format(new Date(appointment.date), "MMM d, yyyy")} at{" "}
                              {appointment.startTime}
                            </p>
                            <p className="text-sm text-gray-500">
                              {appointment.consultationType === "video"
                                ? "Video Consultation"
                                : "In-person Consultation"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {appointment.consultationType === "video" &&
                          appointment.meetingRoomLink && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleJoinMeeting(appointment.meetingRoomLink!)
                              }
                            >
                              <Video className="w-4 h-4 mr-2" />
                              Join Meeting
                            </Button>
                          )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPatient(appointment.patient.id)}
                        >
                          View Patient
                        </Button>
                        {appointment.status === "PENDING" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleStatusChange(appointment.id, "CONFIRMED")
                              }
                            >
                              Confirm
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600"
                              onClick={() =>
                                handleStatusChange(appointment.id, "CANCELLED")
                              }
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {appointment.status === "CONFIRMED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleStatusChange(appointment.id, "COMPLETED")
                            }
                          >
                            Complete
                          </Button>
                        )}
                        {appointment.status === "COMPLETED" && !appointment.prescriptionLink && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedAppointment(appointment)}
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                Upload Prescription
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Upload Prescription</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="notes">Prescription Notes</Label>
                                  <Textarea
                                    id="notes"
                                    value={prescriptionNotes}
                                    onChange={(e) =>
                                      setPrescriptionNotes(e.target.value)
                                    }
                                    placeholder="Enter prescription notes..."
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="file">Prescription File (Optional)</Label>
                                  <Input
                                    id="file"
                                    type="file"
                                    onChange={(e) =>
                                      setPrescriptionFile(
                                        e.target.files ? e.target.files[0] : null
                                      )
                                    }
                                  />
                                </div>
                                <Button
                                  className="w-full"
                                  onClick={handleUploadPrescription}
                                  disabled={isUploading}
                                >
                                  {isUploading ? "Uploading..." : "Upload"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        {appointment.prescriptionLink && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              try {
                                const prescriptionData = JSON.parse(appointment.prescriptionLink || "");
                                if (prescriptionData.notes) {
                                  toast.info(prescriptionData.notes);
                                } else if (appointment.prescriptionLink) {
                                  window.open(appointment.prescriptionLink, "_blank");
                                }
                              } catch {
                                if (appointment.prescriptionLink) {
                                  window.open(appointment.prescriptionLink, "_blank");
                                }
                              }
                            }}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            View Prescription
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  No {activeTab} appointments found
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 