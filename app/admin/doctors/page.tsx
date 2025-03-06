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

const fetchDoctors = async () => {
  const response = await axios.get("/api/admin/doctors");
  return response.data;
};

const createDoctor = async (data) => {
  const response = await axios.post("/api/admin/doctors", data);
  return response.data;
};

const updateDoctor = async (id, data) => {
  const response = await axios.put(`/api/admin/doctors/${id}`, data);
  return response.data;
};

const deleteDoctor = async (id) => {
  const response = await axios.delete(`/api/admin/doctors/${id}`);
  return response.data;
};

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const methods = useForm();

  const fetchAndSetDoctors = async () => {
    const data = await fetchDoctors();
    setDoctors(data);
  };

  useEffect(() => {
    fetchAndSetDoctors();
  }, []);

  const handleCreateDoctor = async (data) => {
    await createDoctor(data);
    fetchAndSetDoctors();
    setIsDialogOpen(false);
  };

  const handleUpdateDoctor = async (data) => {
    await updateDoctor(selectedDoctor.id, data);
    fetchAndSetDoctors();
    setSelectedDoctor(null);
    setIsDialogOpen(false);
  };

  const handleDeleteDoctor = async (id) => {
    await deleteDoctor(id);
    fetchAndSetDoctors();
  };

  const handleDialogOpen = (doctor = null) => {
    setSelectedDoctor(doctor);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setSelectedDoctor(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Doctors</h1>
      <Button onClick={() => handleDialogOpen()}>Add Doctor</Button>
      <Table>
        <TableCaption>A list of doctors.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Specialty</TableHead>
            <TableHead>Years of Experience</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {doctors.map((doctor) => (
            <TableRow key={doctor.id}>
              <TableCell>{doctor.id}</TableCell>
              <TableCell>{doctor.name}</TableCell>
              <TableCell>{doctor.specialty}</TableCell>
              <TableCell>{doctor.yearsOfExperience}</TableCell>
              <TableCell>
                <Button onClick={() => handleDialogOpen(doctor)}>Edit</Button>
                <Button onClick={() => handleDeleteDoctor(doctor.id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedDoctor ? "Edit Doctor" : "Add Doctor"}</DialogTitle>
            <DialogDescription>
              {selectedDoctor ? "Update the doctor details below." : "Fill in the details to add a new doctor."}
            </DialogDescription>
          </DialogHeader>
          <FormProvider {...methods}>
            <Form onSubmit={methods.handleSubmit(selectedDoctor ? handleUpdateDoctor : handleCreateDoctor)}>
              <FormField name="name" defaultValue={selectedDoctor?.name || ""}>
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField name="specialty" defaultValue={selectedDoctor?.specialty || ""}>
                <FormItem>
                  <FormLabel>Specialty</FormLabel>
                  <FormControl>
                    <Input />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField name="yearsOfExperience" defaultValue={selectedDoctor?.yearsOfExperience || ""}>
                <FormItem>
                  <FormLabel>Years of Experience</FormLabel>
                  <FormControl>
                    <Input />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <DialogFooter>
                <Button type="submit">{selectedDoctor ? "Update" : "Create"}</Button>
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
