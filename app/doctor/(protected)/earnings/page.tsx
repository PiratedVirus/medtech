"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useDecryptedProfile } from "@/hooks/use-centralized-profile";
import CdLoader from "@/components/ui/custom/cd-loader";
import { toast } from "react-toastify";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  flexRender,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import DoctorEarningsWidget from "@/components/doctors/home/DoctorEarningsWidget";

// Define Payment type for state
interface Payment {
  id: number;
  appointmentId: number;
  patientName: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
}

interface EarningsData {
  paid: number;
  pending: number;
  cash: number;
  online: number;
  cashCount: number;
  onlineCount: number;
  total: number;
}

export default function DoctorEarningsPage() {
  const { profile, isLoading: profileLoading } = useDecryptedProfile();
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [earnings, setEarnings] = useState<EarningsData>({ paid: 0, pending: 0, cash: 0, online: 0, cashCount: 0, onlineCount: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const columns: ColumnDef<Payment>[] = [
    {
      accessorKey: "patientName",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Patient Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Amount <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => `₹${((row.getValue("amount") as number) / 100).toFixed(2)}`,
      enableSorting: true,
    },
    {
      accessorKey: "paymentMethod",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Payment Method <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "paymentStatus",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Status <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        row.getValue("paymentStatus") === "PENDING" ? (
          <Badge variant="destructive">Pending</Badge>
        ) : (
          <Badge variant="default">Paid</Badge>
        )
      ),
      enableSorting: true,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Date <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => new Date(row.getValue("createdAt")).toLocaleDateString(),
      enableSorting: true,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div>
          {row.original.paymentStatus === "PENDING" ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  Collect
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Payment Collection</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p>Are you sure you want to mark this payment as collected?</p>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleCollectPayment(row.original.id)}
                    >
                      Confirm
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <span className="text-green-600">✓ Collected</span>
          )}
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: allPayments,
    columns,
    pageCount: Math.ceil(allPayments.length / pagination.pageSize),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const fetchPayments = async () => {
    if (!profile?.id) return;
    
    try {
      setIsLoading(true);
      const res = await axios.get(`/api/doctor/earnings`);
      const data = res.data.data || res.data; // Support both formats during transition
      setAllPayments(data.payments || []);
      setEarnings(data.earnings || { paid: 0, pending: 0, cash: 0, online: 0, cashCount: 0, onlineCount: 0, total: 0 });
    } catch (error) {
      console.error("Error fetching earnings:", error);
      toast.error("Failed to fetch earnings data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchPayments();
    }
  }, [profile?.id]);

  const handleCollectPayment = async (paymentId: number) => {
    try {
      await axios.put("/api/doctor/earnings/collect-payment", { paymentId });
      toast.success("Payment collected successfully!");
      fetchPayments(); // Refresh the data
    } catch (error) {
      console.error("Error collecting payment:", error);
      toast.error("Failed to collect payment");
    }
  };

  if (profileLoading || isLoading) {
    return <CdLoader />;
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-center text-gray-600">Please log in to view your earnings.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4 bg-mutedbg">
      {/* Earnings Cards */}
      <div className="grid grid-cols-4 md:grid-cols-4 gap-4 mb-6">
        <div className="col-span-1">
          <DoctorEarningsWidget isDropdownVisible={false} earningType="paid" />
        </div>
        <div className="col-span-1">
          <DoctorEarningsWidget isDropdownVisible={false} earningType="pending" />
        </div>
        <div className="col-span-1">
          <DoctorEarningsWidget isDropdownVisible={false} earningType="cash" />
        </div>
        <div className="col-span-1">
          <DoctorEarningsWidget isDropdownVisible={false} earningType="online" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 border rounded-lg bg-custom-mutedgreen flex flex-col items-end">
          <h3 className="text-lg font-semibold">Total Earnings (Paid)</h3>
          <p className="text-3xl text-primary">₹{(earnings.paid / 100).toFixed(2)}</p>
        </div>
        <div className="p-4 border rounded-lg bg-custom-mutedgreen flex flex-col items-end">
          <h3 className="text-lg font-semibold">Pending Earnings</h3>
          <p className="text-3xl text-primary">₹{(earnings.pending / 100).toFixed(2)}</p>
        </div>
        <div className="p-4 border rounded-lg bg-custom-mutedgreen flex flex-col items-end">
          <h3 className="text-lg font-semibold">Cash Payments</h3>
          <p className="text-3xl text-primary">₹{(earnings.cash / 100).toFixed(2)}</p>
        </div>
        <div className="p-4 border rounded-lg bg-custom-mutedgreen flex flex-col items-end">
          <h3 className="text-lg font-semibold">Online Payments</h3>
          <p className="text-3xl text-primary">₹{(earnings.online / 100).toFixed(2)}</p>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search by patient name"
            value={(table.getColumn("patientName")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("patientName")?.setFilterValue(event.target.value)
            }
            className="max-w-md"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader className="bg-custom-mutedgreen text-gray-950">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow className="text-center" key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-black text-center">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow className="text-center" key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">No payments found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing {pagination.pageIndex * pagination.pageSize + 1}-
          {Math.min((pagination.pageIndex + 1) * pagination.pageSize, allPayments.length)} of {allPayments.length} payments
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${pagination.pageSize}`}
              onValueChange={(value) => {
                setPagination((prev) => ({
                  ...prev,
                  pageSize: Number(value),
                  pageIndex: 0,
                }));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 