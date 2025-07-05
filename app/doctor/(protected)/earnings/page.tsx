"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";

// Define Payment type for state
interface Payment {
  id: number;
  appointmentId: number;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
}

export default function DoctorEarningsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [earnings, setEarnings] = useState({ total: 0, appointment: 0 });
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchPayments() {
      const res = await axios.get(`/api/doctor/earnings?search=${search}`);
      setPayments(res.data.payments);
      setEarnings(res.data.earnings);
    }
    fetchPayments();
  }, [search]);

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 border rounded-lg bg-custom-mutedgreen flex flex-col items-end">
          <h3 className="text-lg font-semibold">Appointment Earnings</h3>
          <p className="text-3xl text-primary">₹{earnings.appointment.toFixed(2)}</p>
        </div>
        <div className="p-4 border rounded-lg bg-custom-mutedgreen flex flex-col items-end">
          <h3 className="text-lg font-semibold">Total Earnings</h3>
          <p className="text-3xl text-primary">₹{earnings.total.toFixed(2)}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 mb-2">
        <Input
          placeholder="Search payments..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-custom-mutedgreen text-gray-950">
            <TableRow>
              <TableHead>Appointment ID</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length ? (
              payments.map((p) => (
                <TableRow key={p.id} className="text-center">
                  <TableCell>{p.appointmentId}</TableCell>
                  <TableCell>₹{(p.amount / 100).toFixed(2)}</TableCell>
                  <TableCell>{p.paymentMethod}</TableCell>
                  <TableCell>{p.paymentStatus}</TableCell>
                  <TableCell>{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">No results.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 