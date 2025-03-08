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

const fetchAppointments = async (pageIndex, pageSize) => {
  try {
    const response = await axios.get(`/api/admin/appointments?page=${pageIndex + 1}&pageSize=${pageSize}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch appointments:", error);
    return { data: [], total: 0 };
  }
};

const createAppointment = async (data) => {
  try {
    const response = await axios.post("/api/admin/appointments", data);
    return response.data;
  } catch (error) {
    console.error("Failed to create appointment:", error);
    return null;
  }
};

const updateAppointment = async (id, data) => {
  try {
    const response = await axios.put(`/api/admin/appointments/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Failed to update appointment:", error);
    return null;
  }
};

const deleteAppointment = async (id) => {
  try {
    const response = await axios.delete(`/api/admin/appointments/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete appointment:", error);
    return null;
  }
};

export default function AppointmentsPage() {
  const [data, setData] = useState({ appointments: [], total: 0 });
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { register, handleSubmit, reset, setValue } = useForm();
  const [sorting, setSorting] = useState<SortingState>([{ id: "appointmentDate", desc: true }]);
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
      accessorKey: "fullName",
      id: "fullName",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Patient <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "doctor.name",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Doctor <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "appointmentDate",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Date <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => new Date(row.getValue("appointmentDate")).toLocaleString(),
      enableSorting: true,
    },
    {
      accessorKey: "status",
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
              setSelectedAppointment(row.original);
              setValue("patient", row.original.fullName);
              setValue("doctor", row.original.doctor.name);
              setValue("appointmentDate", row.original.appointmentDate);
              setValue("status", row.original.status);
              setDialogOpen(true);
            }}
          >
            <EditIcon className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="destructive" onClick={() => deleteAppointment(row.original.id)}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: data.appointments,
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
    const { data, total } = await fetchAppointments(pagination.pageIndex, pagination.pageSize);
    setData({ appointments: data, total });
  };

  useEffect(() => {
    fetchData();
  }, [pagination.pageIndex, pagination.pageSize, sorting]);

  useEffect(() => {
    if (selectedAppointment) {
      setValue("patient", selectedAppointment.fullName);
      setValue("doctor", selectedAppointment.doctor.name);
      setValue("appointmentDate", selectedAppointment.appointmentDate);
      setValue("status", selectedAppointment.status);
    } else {
      reset();
    }
  }, [selectedAppointment, setValue, reset]);

  const onSubmit = async (formData) => {
    try {
      if (selectedAppointment) {
        await updateAppointment(selectedAppointment.id, formData);
        toast.success("Appointment updated successfully");
      } else {
        await createAppointment(formData);
        toast.success("Appointment created successfully");
      }
      await fetchData();
      setDialogOpen(false);
      reset();
      setSelectedAppointment(null);
    } catch (error) {
      console.error("Error saving appointment:", error);
      toast.error("Failed to save appointment");
    }
  };

  const deleteSelected = async () => {
    const selectedIds = Object.keys(rowSelection).map(
      (index) => data.appointments[parseInt(index)].id
    );
    try {
      await axios.delete("/api/admin/appointments", { data: { ids: selectedIds } });
      toast.success("Selected appointments deleted successfully");
      await fetchData();
      setRowSelection({});
    } catch (error) {
      console.error("Error deleting appointments:", error);
      toast.error("Failed to delete selected appointments");
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <ToastContainer />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search appointments..."
            value={(table.getColumn("fullName")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("fullName")?.setFilterValue(event.target.value)
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
          <Button onClick={() => setDialogOpen(true)}>Add Appointment</Button>
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
          {Math.min((pagination.pageIndex + 1) * pagination.pageSize, data.total)} of {data.total} appointments
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
            <DialogTitle>{selectedAppointment ? "Edit Appointment" : "Create New Appointment"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input {...register("patient", { required: true })} placeholder="Patient" />
            <Input {...register("doctor", { required: true })} placeholder="Doctor" />
            <Input {...register("appointmentDate", { required: true })} type="datetime-local" placeholder="Appointment Date" />
            <Input {...register("status", { required: true })} placeholder="Status" />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setSelectedAppointment(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">{selectedAppointment ? "Save Changes" : "Create Appointment"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
