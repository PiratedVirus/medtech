"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm, FormProvider } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

const fetchAppointments = async () => {
  const response = await axios.get("/api/admin/appointments");
  return response.data;
};

const createAppointment = async (data) => {
  const response = await axios.post("/api/admin/appointments", data);
  return response.data;
};

const updateAppointment = async (id, data) => {
  const response = await axios.put(`/api/admin/appointments/${id}`, data);
  return response.data;
};

const deleteAppointment = async (id) => {
  const response = await axios.delete(`/api/admin/appointments/${id}`);
  return response.data;
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const methods = useForm();

  const fetchAndSetAppointments = async () => {
    const data = await fetchAppointments();
    setAppointments(data);
  };

  useEffect(() => {
    fetchAndSetAppointments();
  }, []);

  const handleCreateAppointment = async (data) => {
    await createAppointment(data);
    fetchAndSetAppointments();
    setIsDialogOpen(false);
  };

  const handleUpdateAppointment = async (data) => {
    await updateAppointment(selectedAppointment.id, data);
    fetchAndSetAppointments();
    setSelectedAppointment(null);
    setIsDialogOpen(false);
  };

  const handleDeleteAppointment = async (id) => {
    await deleteAppointment(id);
    fetchAndSetAppointments();
  };

  const handleDialogOpen = (appointment = null) => {
    setSelectedAppointment(appointment);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setSelectedAppointment(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Appointments</h1>
      <Button onClick={() => handleDialogOpen()}>Add Appointment</Button>
      <Table>
        <TableCaption>A list of appointments.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Patient</TableHead>
            <TableHead>Doctor</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.map((appointment) => (
            <TableRow key={appointment.id}>
              <TableCell>{appointment.id}</TableCell>
              <TableCell>{appointment.patient.name}</TableCell>
              <TableCell>{appointment.doctor.name}</TableCell>
              <TableCell>{appointment.appointmentDate}</TableCell>
              <TableCell>{appointment.status}</TableCell>
              <TableCell>
                <Button onClick={() => handleDialogOpen(appointment)}>Edit</Button>
                <Button onClick={() => handleDeleteAppointment(appointment.id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedAppointment ? "Edit Appointment" : "Add Appointment"}</DialogTitle>
            <DialogDescription>
              {selectedAppointment ? "Update the appointment details below." : "Fill in the details to add a new appointment."}
            </DialogDescription>
          </DialogHeader>
          <FormProvider {...methods}>
            <Form onSubmit={methods.handleSubmit(selectedAppointment ? handleUpdateAppointment : handleCreateAppointment)}>
              <FormField name="patient" defaultValue={selectedAppointment?.patient || ""}>
                <FormItem>
                  <FormLabel>Patient</FormLabel>
                  <FormControl>
                    <Input />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField name="doctor" defaultValue={selectedAppointment?.doctor || ""}>
                <FormItem>
                  <FormLabel>Doctor</FormLabel>
                  <FormControl>
                    <Input />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField name="appointmentDate" defaultValue={selectedAppointment?.appointmentDate || ""}>
                <FormItem>
                  <FormLabel>Appointment Date</FormLabel>
                  <FormControl>
                    <Input />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField name="status" defaultValue={selectedAppointment?.status || ""}>
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Input />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <DialogFooter>
                <Button type="submit">{selectedAppointment ? "Update" : "Create"}</Button>
                <DialogClose asChild>
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                </DialogClose>
              </DialogFooter>
            </Form>
          </FormProvider>
        </DialogContent>
      </Dialog>
    </div>
  );
}
