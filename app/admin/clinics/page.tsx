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

const fetchClinics = async () => {
  const response = await axios.get("/api/admin/clinics");
  return response.data;
};

const createClinic = async (data) => {
  const response = await axios.post("/api/admin/clinics", data);
  return response.data;
};

const updateClinic = async (id, data) => {
  const response = await axios.put(`/api/admin/clinics/${id}`, data);
  return response.data;
};

const deleteClinic = async (id) => {
  const response = await axios.delete(`/api/admin/clinics/${id}`);
  return response.data;
};

export default function ClinicsPage() {
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const methods = useForm();

  const fetchAndSetClinics = async () => {
    const data = await fetchClinics();
    setClinics(data);
  };

  useEffect(() => {
    fetchAndSetClinics();
  }, []);

  const handleCreateClinic = async (data) => {
    await createClinic(data);
    fetchAndSetClinics();
    setIsDialogOpen(false);
  };

  const handleUpdateClinic = async (data) => {
    await updateClinic(selectedClinic.id, data);
    fetchAndSetClinics();
    setSelectedClinic(null);
    setIsDialogOpen(false);
  };

  const handleDeleteClinic = async (id) => {
    await deleteClinic(id);
    fetchAndSetClinics();
  };

  const handleDialogOpen = (clinic = null) => {
    setSelectedClinic(clinic);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setSelectedClinic(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Clinics</h1>
      <Button onClick={() => handleDialogOpen()}>Add Clinic</Button>
      <Table>
        <TableCaption>A list of clinics.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Contact Info</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clinics.map((clinic) => (
            <TableRow key={clinic.id}>
              <TableCell>{clinic.id}</TableCell>
              <TableCell>{clinic.name}</TableCell>
              <TableCell>{clinic.address}</TableCell>
              <TableCell>{clinic.contactInfo}</TableCell>
              <TableCell>
                <Button onClick={() => handleDialogOpen(clinic)}>Edit</Button>
                <Button onClick={() => handleDeleteClinic(clinic.id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedClinic ? "Edit Clinic" : "Add Clinic"}</DialogTitle>
            <DialogDescription>
              {selectedClinic ? "Update the clinic details below." : "Fill in the details to add a new clinic."}
            </DialogDescription>
          </DialogHeader>
          <FormProvider {...methods}>
            <Form onSubmit={methods.handleSubmit(selectedClinic ? handleUpdateClinic : handleCreateClinic)}>
              <FormField name="name" defaultValue={selectedClinic?.name || ""}>
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField name="address" defaultValue={selectedClinic?.address || ""}>
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField name="contactInfo" defaultValue={selectedClinic?.contactInfo || ""}>
                <FormItem>
                  <FormLabel>Contact Info</FormLabel>
                  <FormControl>
                    <Input />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <DialogFooter>
                <Button type="submit">{selectedClinic ? "Update" : "Create"}</Button>
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
