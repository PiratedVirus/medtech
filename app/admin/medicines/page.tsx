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

const fetchMedicines = async () => {
  const response = await axios.get("/api/admin/medicines");
  return response.data;
};

const createMedicine = async (data) => {
  const response = await axios.post("/api/admin/medicines", data);
  return response.data;
};

const updateMedicine = async (id, data) => {
  const response = await axios.put(`/api/admin/medicines/${id}`, data);
  return response.data;
};

const deleteMedicine = async (id) => {
  const response = await axios.delete(`/api/admin/medicines/${id}`);
  return response.data;
};

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const methods = useForm();

  const fetchAndSetMedicines = async () => {
    const data = await fetchMedicines();
    setMedicines(data);
  };

  useEffect(() => {
    fetchAndSetMedicines();
  }, []);

  const handleCreateMedicine = async (data) => {
    await createMedicine(data);
    fetchAndSetMedicines();
    setIsDialogOpen(false);
  };

  const handleUpdateMedicine = async (data) => {
    await updateMedicine(selectedMedicine.id, data);
    fetchAndSetMedicines();
    setSelectedMedicine(null);
    setIsDialogOpen(false);
  };

  const handleDeleteMedicine = async (id) => {
    await deleteMedicine(id);
    fetchAndSetMedicines();
  };

  const handleDialogOpen = (medicine = null) => {
    setSelectedMedicine(medicine);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setSelectedMedicine(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Medicines</h1>
      <Button onClick={() => handleDialogOpen()}>Add Medicine</Button>
      <Table>
        <TableCaption>A list of medicines.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {medicines.map((medicine) => (
            <TableRow key={medicine.id}>
              <TableCell>{medicine.id}</TableCell>
              <TableCell>{medicine.name}</TableCell>
              <TableCell>{medicine.category}</TableCell>
              <TableCell>{medicine.description}</TableCell>
              <TableCell>{medicine.price}</TableCell>
              <TableCell>
                <Button onClick={() => handleDialogOpen(medicine)}>Edit</Button>
                <Button onClick={() => handleDeleteMedicine(medicine.id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedMedicine ? "Edit Medicine" : "Add Medicine"}</DialogTitle>
            <DialogDescription>
              {selectedMedicine ? "Update the medicine details below." : "Fill in the details to add a new medicine."}
            </DialogDescription>
          </DialogHeader>
          <FormProvider {...methods}>
            <Form onSubmit={methods.handleSubmit(selectedMedicine ? handleUpdateMedicine : handleCreateMedicine)}>
              <FormField name="name" defaultValue={selectedMedicine?.name || ""}>
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField name="category" defaultValue={selectedMedicine?.category || ""}>
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField name="description" defaultValue={selectedMedicine?.description || ""}>
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField name="price" defaultValue={selectedMedicine?.price || ""}>
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <DialogFooter>
                <Button type="submit">{selectedMedicine ? "Update" : "Create"}</Button>
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
