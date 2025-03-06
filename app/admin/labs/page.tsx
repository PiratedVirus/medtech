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

const fetchLabs = async () => {
  const response = await axios.get("/api/admin/labs");
  return response.data;
};

const createLab = async (data) => {
  const response = await axios.post("/api/admin/labs", data);
  return response.data;
};

const updateLab = async (id, data) => {
  const response = await axios.put(`/api/admin/labs/${id}`, data);
  return response.data;
};

const deleteLab = async (id) => {
  const response = await axios.delete(`/api/admin/labs/${id}`);
  return response.data;
};

export default function LabsPage() {
  const [labs, setLabs] = useState([]);
  const [selectedLab, setSelectedLab] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const methods = useForm();

  const fetchAndSetLabs = async () => {
    const data = await fetchLabs();
    setLabs(data);
  };

  useEffect(() => {
    fetchAndSetLabs();
  }, []);

  const handleCreateLab = async (data) => {
    await createLab(data);
    fetchAndSetLabs();
    setIsDialogOpen(false);
  };

  const handleUpdateLab = async (data) => {
    await updateLab(selectedLab.id, data);
    fetchAndSetLabs();
    setSelectedLab(null);
    setIsDialogOpen(false);
  };

  const handleDeleteLab = async (id) => {
    await deleteLab(id);
    fetchAndSetLabs();
  };

  const handleDialogOpen = (lab = null) => {
    setSelectedLab(lab);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setSelectedLab(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Labs</h1>
      <Button onClick={() => handleDialogOpen()}>Add Lab</Button>
      <Table>
        <TableCaption>A list of labs.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Specialization</TableHead>
            <TableHead>Contact Info</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {labs.map((lab) => (
            <TableRow key={lab.id}>
              <TableCell>{lab.id}</TableCell>
              <TableCell>{lab.name}</TableCell>
              <TableCell>{lab.specialization}</TableCell>
              <TableCell>{lab.contactInfo}</TableCell>
              <TableCell>
                <Button onClick={() => handleDialogOpen(lab)}>Edit</Button>
                <Button onClick={() => handleDeleteLab(lab.id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedLab ? "Edit Lab" : "Add Lab"}</DialogTitle>
            <DialogDescription>
              {selectedLab ? "Update the lab details below." : "Fill in the details to add a new lab."}
            </DialogDescription>
          </DialogHeader>
          <FormProvider {...methods}>
            <Form onSubmit={methods.handleSubmit(selectedLab ? handleUpdateLab : handleCreateLab)}>
              <FormField name="name" defaultValue={selectedLab?.name || ""}>
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField name="specialization" defaultValue={selectedLab?.specialization || ""}>
                <FormItem>
                  <FormLabel>Specialization</FormLabel>
                  <FormControl>
                    <Input />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField name="contactInfo" defaultValue={selectedLab?.contactInfo || ""}>
                <FormItem>
                  <FormLabel>Contact Info</FormLabel>
                  <FormControl>
                    <Input />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <DialogFooter>
                <Button type="submit">{selectedLab ? "Update" : "Create"}</Button>
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
