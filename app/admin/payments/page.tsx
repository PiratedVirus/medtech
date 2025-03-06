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

const fetchPayments = async () => {
  const response = await axios.get("/api/admin/payments");
  return response.data;
};

const createPayment = async (data) => {
  const response = await axios.post("/api/admin/payments", data);
  return response.data;
};

const updatePayment = async (id, data) => {
  const response = await axios.put(`/api/admin/payments/${id}`, data);
  return response.data;
};

const deletePayment = async (id) => {
  const response = await axios.delete(`/api/admin/payments/${id}`);
  return response.data;
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const methods = useForm();

  const fetchAndSetPayments = async () => {
    const data = await fetchPayments();
    setPayments(data);
  };

  useEffect(() => {
    fetchAndSetPayments();
  }, []);

  const handleCreatePayment = async (data) => {
    await createPayment(data);
    fetchAndSetPayments();
    setIsDialogOpen(false);
  };

  const handleUpdatePayment = async (data) => {
    await updatePayment(selectedPayment.id, data);
    fetchAndSetPayments();
    setSelectedPayment(null);
    setIsDialogOpen(false);
  };

  const handleDeletePayment = async (id) => {
    await deletePayment(id);
    fetchAndSetPayments();
  };

  const handleDialogOpen = (payment = null) => {
    setSelectedPayment(payment);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setSelectedPayment(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Payments</h1>
      <Button onClick={() => handleDialogOpen()}>Add Payment</Button>
      <Table>
        <TableCaption>A list of payments.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Appointment ID</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>{payment.id}</TableCell>
              <TableCell>{payment.appointmentId}</TableCell>
              <TableCell>{payment.amount}</TableCell>
              <TableCell>{payment.currency}</TableCell>
              <TableCell>{payment.paymentStatus}</TableCell>
              <TableCell>
                <Button onClick={() => handleDialogOpen(payment)}>Edit</Button>
                <Button onClick={() => handleDeletePayment(payment.id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedPayment ? "Edit Payment" : "Add Payment"}</DialogTitle>
            <DialogDescription>
              {selectedPayment ? "Update the payment details below." : "Fill in the details to add a new payment."}
            </DialogDescription>
          </DialogHeader>
          <FormProvider {...methods}>
            <Form onSubmit={methods.handleSubmit(selectedPayment ? handleUpdatePayment : handleCreatePayment)}>
              <FormField name="appointmentId" defaultValue={selectedPayment?.appointmentId || ""}>
                <FormItem>
                  <FormLabel>Appointment ID</FormLabel>
                  <FormControl>
                    <Input />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField name="amount" defaultValue={selectedPayment?.amount || ""}>
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField name="currency" defaultValue={selectedPayment?.currency || ""}>
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <FormControl>
                    <Input />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField name="paymentStatus" defaultValue={selectedPayment?.paymentStatus || ""}>
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Input />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <DialogFooter>
                <Button type="submit">{selectedPayment ? "Update" : "Create"}</Button>
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
