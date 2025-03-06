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

const fetchDieticians = async () => {
  const response = await axios.get("/api/admin/dieticians");
  return response.data;
};

const createDietician = async (data) => {
  const response = await axios.post("/api/admin/dieticians", data);
  return response.data;
};

const updateDietician = async (id, data) => {
  const response = await axios.put(`/api/admin/dieticians/${id}`, data);
  return response.data;
};

const deleteDietician = async (id) => {
  const response = await axios.delete(`/api/admin/dieticians/${id}`);
  return response.data;
};

export default function DieticiansPage() {
  const [dieticians, setDieticians] = useState([]);
  const [selectedDietician, setSelectedDietician] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const methods = useForm();

  const fetchAndSetDieticians = async () => {
    const data = await fetchDieticians();
    setDieticians(data);
  };

  useEffect(() => {
    fetchAndSetDieticians();
  }, []);

  const handleCreateDietician = async (data) => {
    await createDietician(data);
    fetchAndSetDieticians();
    setIsDialogOpen(false);
  };

  const handleUpdateDietician = async (data) => {
    await updateDietician(selectedDietician.id, data);
    fetchAndSetDieticians();
    setSelectedDietician(null);
    setIsDialogOpen(false);
  };

  const handleDeleteDietician = async (id) => {
    await deleteDietician(id);
    fetchAndSetDieticians();
  };

  const handleDialogOpen = (dietician = null) => {
    setSelectedDietician(dietician);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setSelectedDietician(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dieticians</h1>
      <Button onClick={() => handleDialogOpen()}>Add Dietician</Button>
      <Table>
        <TableCaption>A list of dieticians.</TableCaption>
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
          {dieticians.map((dietician) => (
            <TableRow key={dietician.id}>
              <TableCell>{dietician.id}</TableCell>
              <TableCell>{dietician.name}</TableCell>
              <TableCell>{dietician.specialty}</TableCell>
              <TableCell>{dietician.yearsOfExperience}</TableCell>
              <TableCell>
                <Button onClick={() => handleDialogOpen(dietician)}>Edit</Button>
                <Button onClick={() => handleDeleteDietician(dietician.id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedDietician ? "Edit Dietician" : "Add Dietician"}</DialogTitle>
            <DialogDescription>
              {selectedDietician ? "Update the dietician details below." : "Fill in the details to add a new dietician."}
            </DialogDescription>
          </DialogHeader>
          <FormProvider {...methods}>
            <Form onSubmit={methods.handleSubmit(selectedDietician ? handleUpdateDietician : handleCreateDietician)}>
              <FormField name="name" defaultValue={selectedDietician?.name || ""}>
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField name="specialty" defaultValue={selectedDietician?.specialty || ""}>
                <FormItem>
                  <FormLabel>Specialty</FormLabel>
                  <FormControl>
                    <Input />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField name="yearsOfExperience" defaultValue={selectedDietician?.yearsOfExperience || ""}>
                <FormItem>
                  <FormLabel>Years of Experience</FormLabel>
                  <FormControl>
                    <Input />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <DialogFooter>
                <Button type="submit">{selectedDietician ? "Update" : "Create"}</Button>
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
