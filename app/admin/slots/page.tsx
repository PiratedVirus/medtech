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

const fetchDoctorAvailability = async (pageIndex, pageSize) => {
  try {
    const response = await axios.get(`/api/admin/doctorsavailability?page=${pageIndex + 1}&pageSize=${pageSize}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch doctor availability:", error);
    return { data: [], total: 0 };
  }
};

const createDoctorAvailability = async (data) => {
  try {
    const response = await axios.post("/api/admin/doctorsavailability", data);
    return response.data;
  } catch (error) {
    console.error("Failed to create doctor availability:", error);
    return null;
  }
};

const updateDoctorAvailability = async (id, data) => {
  try {
    const response = await axios.put(`/api/admin/doctorsavailability/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Failed to update doctor availability:", error);
    return null;
  }
};

const deleteDoctorAvailability = async (id) => {
  try {
    const response = await axios.delete(`/api/admin/doctorsavailability/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete doctor availability:", error);
    return null;
  }
};

export default function DoctorAvailabilityPage() {
  const [data, setData] = useState({ availabilities: [], total: 0 });
  const [selectedAvailability, setSelectedAvailability] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { register, handleSubmit, reset, setValue, control } = useForm();
  const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }]);
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
      accessorKey: "doctor.name",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Doctor <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "date",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Date <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => new Date(row.getValue("date")).toLocaleDateString(),
      enableSorting: true,
    },
    {
      accessorKey: "startTime",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Start Time <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "endTime",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          End Time <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
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
              setSelectedAvailability(row.original);
              setValue("doctor", row.original.doctor.name);
              setValue("date", row.original.date);
              setValue("startTime", row.original.startTime);
              setValue("endTime", row.original.endTime);
              setValue("status", row.original.status);
              setDialogOpen(true);
            }}
          >
            <EditIcon className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="destructive" onClick={() => deleteDoctorAvailability(row.original.id)}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: data.availabilities,
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
    const { data, total } = await fetchDoctorAvailability(pagination.pageIndex, pagination.pageSize);
    setData({ availabilities: data, total });
  };

  useEffect(() => {
    fetchData();
  }, [pagination.pageIndex, pagination.pageSize, sorting]);

  useEffect(() => {
    if (selectedAvailability) {
      setValue("doctor", selectedAvailability.doctor.name);
      setValue("date", selectedAvailability.date);
      setValue("startTime", selectedAvailability.startTime);
      setValue("endTime", selectedAvailability.endTime);
      setValue("status", selectedAvailability.status);
    } else {
      reset();
    }
  }, [selectedAvailability, setValue, reset]);

  const onSubmit = async (formData) => {
    try {
      if (selectedAvailability) {
        await updateDoctorAvailability(selectedAvailability.id, formData);
        toast.success("Doctor availability updated successfully");
      } else {
        await createDoctorAvailability(formData);
        toast.success("Doctor availability created successfully");
      }
      await fetchData();
      setDialogOpen(false);
      reset();
      setSelectedAvailability(null);
    } catch (error) {
      console.error("Error saving doctor availability:", error);
      toast.error("Failed to save doctor availability");
    }
  };

  const deleteSelected = async () => {
    const selectedIds = Object.keys(rowSelection).map(
      (index) => data.availabilities[parseInt(index)].id
    );
    try {
      await axios.delete("/api/admin/doctorsavailability", { data: { ids: selectedIds } });
      toast.success("Selected availabilities deleted successfully");
      await fetchData();
      setRowSelection({});
    } catch (error) {
      console.error("Error deleting availabilities:", error);
      toast.error("Failed to delete selected availabilities");
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <ToastContainer />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search availabilities..."
            value={(table.getColumn("doctor.name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("doctor.name")?.setFilterValue(event.target.value)
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
          <Button onClick={() => setDialogOpen(true)}>Add Availability</Button>
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
          {Math.min((pagination.pageIndex + 1) * pagination.pageSize, data.total)} of {data.total} availabilities
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
            <DialogTitle>{selectedAvailability ? "Edit Availability" : "Create New Availability"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input {...register("doctor", { required: true })} placeholder="Doctor" />
            <Input {...register("date", { required: true })} type="date" placeholder="Date" />
            <Input {...register("startTime", { required: true })} type="time" placeholder="Start Time" />
            <Input {...register("endTime", { required: true })} type="time" placeholder="End Time" />
            <Controller
              name="status"
              control={control}
              defaultValue="available"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setSelectedAvailability(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">{selectedAvailability ? "Save Changes" : "Create Availability"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
