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

const fetchPrescriptions = async () => {
  const response = await axios.get("/api/admin/prescriptions");
  return response.data;
};

const createPrescription = async (data) => {
  const response = await axios.post("/api/admin/prescriptions", data);
  return response.data;
};

const updatePrescription = async (id, data) => {
  const response = await axios.put(`/api/admin/prescriptions/${id}`, data);
  return response.data;
};

const deletePrescription = async (id) => {
  const response = await axios.delete(`/api/admin/prescriptions/${id}`);
  return response.data;
};

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const methods = useForm();

  const fetchAndSetPrescriptions = async () => {
    const data = await fetchPrescriptions();
    setPrescriptions(data);
  };

  useEffect(() => {
    fetchAndSetPrescriptions();
  }, []);

  const handleCreatePrescription = async (data) => {
    await createPrescription(data);
    fetchAndSetPrescriptions();
    setIsDialogOpen(false);
  };

  const handleUpdatePrescription = async (data) => {
    await updatePrescription(selectedPrescription.id, data);
    fetchAndSetPrescriptions();
    setSelectedPrescription(null);
    setIsDialogOpen(false);
  };

  const handleDeletePrescription = async (id) => {
    await deletePrescription(id);
    fetchAndSetPrescriptions();
  };

  const handleDialogOpen = (prescription = null) => {
    setSelectedPrescription(prescription);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setSelectedPrescription(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Prescriptions</h1>
      <Button onClick={() => handleDialogOpen()}>Add Prescription</Button>
      <Table>
        <TableCaption>A list of prescriptions.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Patient</TableHead>
            <TableHead>Doctor</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Link</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prescriptions.map((prescription) => (
            <TableRow key={prescription.id}>
              <TableCell>{prescription.id}</TableCell>
              <TableCell>{prescription.patient.name}</TableCell>
              <TableCell>{prescription.doctor.name}</TableCell>
              <TableCell>{prescription.appointmentDate}</TableCell>
              <TableCell>{prescription.prescriptionLink}</TableCell>
              <TableCell>
                <Button onClick={() => handleDialogOpen(prescription)}>Edit</Button>
                <Button onClick={() => handleDeletePrescription(prescription.id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedPrescription ? "Edit Prescription" : "Add Prescription"}</DialogTitle>
            <DialogDescription>
              {selectedPrescription ? "Update the prescription details below." : "Fill in the details to add a new prescription."}
            </DialogDescription>
          </DialogHeader>
          <FormProvider {...methods}>
            <Form onSubmit={methods.handleSubmit(selectedPrescription ? handleUpdatePrescription : handleCreatePrescription)}>
              <FormField name="patient" defaultValue={selectedPrescription?.patient || ""}>
                <FormItem>
                  <FormLabel>Patient</FormLabel>
                  <FormControl>
                    <Input />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField name="doctor" defaultValue={selectedPrescription?.doctor || ""}>
                <FormItem>
                  <FormLabel>Doctor</FormLabel>
                  <FormControl>
                    <Input />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField name="appointmentDate" defaultValue={selectedPrescription?.appointmentDate || ""}>
                <FormItem>
                  <FormLabel>Appointment Date</FormLabel>
                  <FormControl>
                    <Input />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField name="prescriptionLink" defaultValue={selectedPrescription?.prescriptionLink || ""}>
                <FormItem>
                  <FormLabel>Prescription Link</FormLabel>
                  <FormControl>
                    <Input />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <DialogFooter>
                <Button type="submit">{selectedPrescription ? "Update" : "Create"}</Button>
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
