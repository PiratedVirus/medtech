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

const fetchPayments = async (pageIndex, pageSize) => {
  try {
    const response = await axios.get(`/api/admin/payments?page=${pageIndex + 1}&pageSize=${pageSize}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch payments:", error);
    return { data: [], total: 0 };
  }
};

const createPayment = async (data) => {
  try {
    const response = await axios.post("/api/admin/payments", data);
    return response.data;
  } catch (error) {
    console.error("Failed to create payment:", error);
    return null;
  }
};

const updatePayment = async (id, data) => {
  try {
    const response = await axios.put(`/api/admin/payments/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Failed to update payment:", error);
    return null;
  }
};

const deletePayment = async (id) => {
  try {
    const response = await axios.delete(`/api/admin/payments/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete payment:", error);
    return null;
  }
};

export default function PaymentsPage() {
  const [data, setData] = useState({ payments: [], total: 0 });
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { register, handleSubmit, reset, setValue } = useForm();
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
      accessorKey: "amount",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Amount <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
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
    const { data, total } = await fetchPayments(pagination.pageIndex, pagination.pageSize);
    setData({ payments: data, total });
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
    } else {
      reset();
    }
  }, [selectedPayment, setValue, reset]);

  const onSubmit = async (formData) => {
    try {
      if (selectedPayment) {
        await updatePayment(selectedPayment.id, formData);
        toast.success("Payment updated successfully");
      } else {
        await createPayment(formData);
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
      await axios.delete("/api/admin/payments", { data: { ids: selectedIds } });
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
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-black">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
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
