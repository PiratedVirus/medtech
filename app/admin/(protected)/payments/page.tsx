"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useForm, Controller } from "react-hook-form";
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
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ChevronDown, ArrowUpDown, EditIcon, Trash } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Payment {
  id: string;
  appointmentId: string;
  amount: number;
  currency: string;
  paymentStatus: string;
  labBookingId?: string;
  subscriptionId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

interface FetchPaymentsResponse {
  data: Payment[];
  total: number;
  earnings: {
    lab: number;
    appointment: number;
    subscription: number;
    total: number;
  };
}

const fetchPayments = async (pageIndex: number, pageSize: number): Promise<FetchPaymentsResponse> => {
  try {
    const response = await axios.get(`/api/admin/optimized/payments?page=${pageIndex + 1}&pageSize=${pageSize}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch payments:", error);
    return { data: [], total: 0, earnings: { lab: 0, appointment: 0, subscription: 0, total: 0 } };
  }
};

interface CreatePaymentData {
  appointmentId: string;
  amount: number;
  currency: string;
  paymentStatus: string;
  labBookingId?: string;
  subscriptionId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentMethod?: string;
}

const createPayment = async (data: CreatePaymentData): Promise<Payment | null> => {
  try {
    const response = await axios.post("/api/admin/optimized/payments", data);
    return response.data;
  } catch (error) {
    console.error("Failed to create payment:", error);
    return null;
  }
};

interface UpdatePaymentData {
  appointmentId: string;
  amount: number;
  currency: string;
  paymentStatus: string;
  labBookingId?: string;
  subscriptionId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentMethod?: string;
}

const updatePayment = async (id: string, data: UpdatePaymentData): Promise<Payment | null> => {
  try {
    const response = await axios.put(`/api/admin/payments/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Failed to update payment:", error);
    return null;
  }
};

interface DeletePaymentResponse {
  success: boolean;
}

const deletePayment = async (id: string): Promise<DeletePaymentResponse | null> => {
  try {
    const response = await axios.delete(`/api/admin/payments/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete payment:", error);
    return null;
  }
};

export default function PaymentsPage() {
  const [data, setData] = useState<{ payments: Payment[]; total: number }>({ payments: [], total: 0 });
  const [earnings, setEarnings] = useState({
    lab: 0,
    appointment: 0,
    subscription: 0,
    total: 0,
  });
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { register, handleSubmit, reset, setValue } = useForm<FormData>();
  const [sorting, setSorting] = useState<SortingState>([{ id: "amount", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const columns: ColumnDef<any>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="w-4 h-4"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="w-4 h-4"
        />
      ),
    },
    {
      accessorKey: "appointmentId",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Appointment ID <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "labBookingId",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Lab Booking ID <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "subscriptionId",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Subscription ID <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "razorpayOrderId",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Razorpay Order ID <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "razorpayPaymentId",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Razorpay Payment ID <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
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
      accessorKey: "amount",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Amount <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      // enableSorting: true, // Remove or keep as needed
      cell: ({ row }) => (row.original.amount / 100).toFixed(2),
    },
    {
      accessorKey: "currency",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Currency <ArrowUpDown className="ml-2 h-4 w-4" />
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
      enableSorting: true,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Created At <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
      cell: ({ row }) => new Date(row.getValue("createdAt")).toLocaleString(),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="space-x-2">
          <Button
            size="sm"
            className="bg-transparent text-primary border-0 shadow-none"
            onClick={() => {
              setSelectedPayment(row.original);
              setValue("appointmentId", row.original.appointmentId);
              setValue("amount", row.original.amount);
              setValue("currency", row.original.currency);
              setValue("paymentStatus", row.original.paymentStatus);
              setValue("labBookingId", row.original.labBookingId ?? "");
              setValue("subscriptionId", row.original.subscriptionId ?? "");
              setValue("razorpayOrderId", row.original.razorpayOrderId ?? "");
              setValue("razorpayPaymentId", row.original.razorpayPaymentId ?? "");
              setValue("paymentMethod", row.original.paymentMethod ?? "");
              setDialogOpen(true);
            }}
          >
            <EditIcon className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="destructive" onClick={() => deletePayment(row.original.id)}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: data.payments,
    columns,
    pageCount: Math.ceil(data.total / pagination.pageSize),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    manualPagination: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const fetchData = async () => {
    const { data: rawPayments, total, earnings: rawEarnings } = await fetchPayments(pagination.pageIndex, pagination.pageSize);
    setData({ payments: rawPayments.map(p => ({ ...p, amount: p.amount / 100 })), total });
    setEarnings({
      lab: rawEarnings.lab / 100,
      appointment: rawEarnings.appointment / 100,
      subscription: rawEarnings.subscription / 100,
      total: rawEarnings.total / 100,
    });
  };

  useEffect(() => {
    fetchData();
  }, [pagination.pageIndex, pagination.pageSize, sorting]);

  useEffect(() => {
    if (selectedPayment) {
      setValue("appointmentId", selectedPayment.appointmentId);
      setValue("amount", selectedPayment.amount);
      setValue("currency", selectedPayment.currency);
      setValue("paymentStatus", selectedPayment.paymentStatus);
      setValue("labBookingId", selectedPayment.labBookingId ?? "");
      setValue("subscriptionId", selectedPayment.subscriptionId ?? "");
      setValue("razorpayOrderId", selectedPayment.razorpayOrderId ?? "");
      setValue("razorpayPaymentId", selectedPayment.razorpayPaymentId ?? "");
      setValue("paymentMethod", selectedPayment.paymentMethod ?? "");
    } else {
      reset();
    }
  }, [selectedPayment, setValue, reset]);

  interface FormData {
    appointmentId: string;
    amount: number;
    currency: string;
    paymentStatus: string;
    labBookingId?: string;
    subscriptionId?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    paymentMethod?: string;
  }

  const onSubmit = async (formData: FormData) => {
    try {
      const payload = { ...formData, amount: Math.round(formData.amount * 100) };
      if (selectedPayment) {
        await updatePayment(selectedPayment.id, payload);
        toast.success("Payment updated successfully");
      } else {
        await createPayment(payload);
        toast.success("Payment created successfully");
      }
      await fetchData();
      setDialogOpen(false);
      reset();
      setSelectedPayment(null);
    } catch (error) {
      console.error("Error saving payment:", error);
      toast.error("Failed to save payment");
    }
  };

  const deleteSelected = async () => {
    const selectedIds = Object.keys(rowSelection).map(
      (index) => data.payments[parseInt(index)].id
    );
    try {
      await axios.delete("/api/admin/optimized/payments", { data: { ids: selectedIds } });
      toast.success("Selected payments deleted successfully");
      await fetchData();
      setRowSelection({});
    } catch (error) {
      console.error("Error deleting payments:", error);
      toast.error("Failed to delete selected payments");
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <ToastContainer />
      {/* Stats Section - Earnings */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 border rounded-lg bg-custom-mutedgreen flex flex-col items-end">
          <h3 className="text-lg font-semibold">Lab Earnings</h3>
          <p className="text-3xl text-primary">₹{earnings.lab.toFixed(2)}</p>
        </div>
        <div className="p-4 border rounded-lg bg-custom-mutedgreen flex flex-col items-end">
          <h3 className="text-lg font-semibold">Appointment Earnings</h3>
          <p className="text-3xl text-primary">₹{earnings.appointment.toFixed(2)}</p>
        </div>
        <div className="p-4 border rounded-lg bg-custom-mutedgreen flex flex-col items-end">
          <h3 className="text-lg font-semibold">Subscription Earnings</h3>
          <p className="text-3xl text-primary">₹{earnings.subscription.toFixed(2)}</p>
        </div>
        <div className="p-4 border rounded-lg bg-custom-mutedgreen flex flex-col items-end">
          <h3 className="text-lg font-semibold">Total Earnings</h3>
          <p className="text-3xl text-primary">₹{earnings.total.toFixed(2)}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search payments..."
            value={(table.getColumn("appointmentId")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("appointmentId")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white text-black" align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {Object.keys(rowSelection).length > 0 && (
            <Button variant="destructive" onClick={deleteSelected}>
              Delete Selected
            </Button>
          )}
        </div>
        <div>
          <Button onClick={() => setDialogOpen(true)}>Add Payment</Button>
        </div>
      </div>
      <div className="rounded-md border">
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
                <TableRow className="text-center" key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="text-center">
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing {pagination.pageIndex * pagination.pageSize + 1}-
          {Math.min((pagination.pageIndex + 1) * pagination.pageSize, data.total)} of {data.total} payments
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
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedPayment ? "Edit Payment" : "Create New Payment"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input {...register("appointmentId", { required: true })} placeholder="Appointment ID" />
            <Input {...register("labBookingId")} placeholder="Lab Booking ID" />
            <Input {...register("subscriptionId")} placeholder="Subscription ID" />
            <Input {...register("razorpayOrderId")} placeholder="Razorpay Order ID" />
            <Input {...register("razorpayPaymentId")} placeholder="Razorpay Payment ID" />
            <Input {...register("paymentMethod")} placeholder="Payment Method" />
            <Input {...register("amount", { required: true })} placeholder="Amount" />
            <Input {...register("currency", { required: true })} placeholder="Currency" />
            <Input {...register("paymentStatus", { required: true })} placeholder="Status" />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setSelectedPayment(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">{selectedPayment ? "Save Changes" : "Create Payment"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
