"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
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

type Doctor = {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  specialty: string;
  yearsOfExperience: number;
  status: string;
  clinic?: { name: string; id: number };
  createdAt: string;
};

export default function DoctorsPage() {
  const [data, setData] = useState<{ doctors: Doctor[]; total: number }>({ doctors: [], total: 0 });
  const [clinics, setClinics] = useState([]);
  const [roleCounts, setRoleCounts] = useState<{ [key: string]: number }>({});
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { register, handleSubmit, reset, setValue } = useForm();
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const columns: ColumnDef<Doctor>[] = [
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
      accessorKey: "name",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Email <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "phoneNumber",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Phone <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "specialty",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Specialty <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "yearsOfExperience",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Years of Experience <ArrowUpDown className="ml-2 h-4 w-4" />
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
      accessorKey: "clinic.name",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Clinic <ArrowUpDown className="ml-2 h-4 w-4" />
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
      cell: ({ row }) => new Date(row.getValue("createdAt")).toLocaleString(),
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
              setSelectedDoctor(row.original);
              setDialogOpen(true);
            }}
          >
            <EditIcon className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="destructive" onClick={() => deleteDoctor(row.original.id)}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: data.doctors,
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
    try {
      const [doctorsRes, clinicsRes] = await Promise.all([
        axios.get(`/api/admin/doctors?page=${pagination.pageIndex + 1}&pageSize=${pagination.pageSize}`),
        axios.get("/api/admin/clinics"),
      ]);
      setData({ doctors: doctorsRes.data.data, total: doctorsRes.data.total });
      setClinics(clinicsRes.data);
      // Extract roleCounts from the GET response
      setRoleCounts(doctorsRes.data.roleCounts || {});
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.pageIndex, pagination.pageSize, sorting]);

  useEffect(() => {
    if (selectedDoctor) {
      setValue("name", selectedDoctor.name);
      setValue("phoneNumber", selectedDoctor.phoneNumber);
      setValue("email", selectedDoctor.email);
      setValue("specialty", selectedDoctor.specialty);
      setValue("yearsOfExperience", selectedDoctor.yearsOfExperience);
      setValue("clinicId", selectedDoctor.clinic?.id);
      setValue("status", selectedDoctor.status);
    } else {
      reset();
    }
  }, [selectedDoctor, setValue, reset]);

  const onSubmit = async (formData: any) => {
    try {
      const payload = {
        ...formData,
        clinicId: formData.clinicId ? Number(formData.clinicId) : null,
        status: formData.status || "ACTIVE",
      };

      if (selectedDoctor) {
        await axios.put("/api/admin/doctors", { id: selectedDoctor.id, ...payload });
        toast.success("Doctor updated successfully");
      } else {
        await axios.post("/api/admin/doctors", payload);
        toast.success("Doctor created successfully");
      }

      await fetchData();
      setDialogOpen(false);
      reset();
      setSelectedDoctor(null);
    } catch (error) {
      console.error("Error saving doctor:", error);
      toast.error("Failed to save doctor");
    }
  };

  const deleteDoctor = async (id: number) => {
    try {
      await axios.delete("/api/admin/doctors", { data: { id } });
      toast.success("Doctor deleted successfully");
      await fetchData();
    } catch (error) {
      console.error("Error deleting doctor:", error);
      toast.error("Failed to delete doctor");
    }
  };

  const deleteSelected = async () => {
    const selectedIds = Object.keys(rowSelection).map(
      (index) => data.doctors[parseInt(index)].id
    );
    try {
      await axios.delete("/api/admin/doctors", { data: { ids: selectedIds } });
      toast.success("Selected doctors deleted successfully");
      await fetchData();
      setRowSelection({});
    } catch (error) {
      console.error("Error deleting doctors:", error);
      toast.error("Failed to delete selected doctors");
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* ToastContainer renders the toasts */}
      <ToastContainer />
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">Doctors</h1>
      </div>

      {/* Stats Section - Cards for role counts */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg bg-custom-mutedgreen items-end flex flex-col">
          <h3 className="text-lg font-semibold">Total Doctors</h3>
          <p className="text-3xl text-primary">{roleCounts.DOCTOR || 0}</p>
        </div>
        <div className="p-4 border rounded-lg bg-custom-mutedgreen items-end flex flex-col">
          <h3 className="text-lg font-semibold">Total Lab Technicians</h3>
          <p className="text-3xl text-primary">{roleCounts.LAB_TECH || 0}</p>
        </div>
        <div className="p-4 border rounded-lg bg-custom-mutedgreen items-end flex flex-col">
          <h3 className="text-lg font-semibold">Total Patients</h3>
          <p className="text-3xl text-primary">{roleCounts.PATIENT || 0}</p>
        </div>
        <div className="p-4 border rounded-lg bg-custom-mutedgreen items-end flex flex-col">
          <h3 className="text-lg font-semibold">Total Users</h3>
          <p className="text-3xl text-primary">{data.total}</p>
        </div>
      </div>

      {/* Table & Controls */}
      <div className="flex items-center justify-between">
        {/* Left group */}
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search doctors..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
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
        {/* Right group */}
        <div>
          <Button onClick={() => setDialogOpen(true)}>Add Doctor</Button>
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
          {Math.min((pagination.pageIndex + 1) * pagination.pageSize, data.total)} of {data.total} doctors
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
            <DialogTitle>{selectedDoctor ? "Edit Doctor" : "Create New Doctor"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input {...register("name", { required: true })} placeholder="Full Name" />
            <Input {...register("phoneNumber", { required: true })} placeholder="Phone Number" />
            <Input {...register("email")} type="email" placeholder="Email" />
            <Input {...register("specialty", { required: true })} placeholder="Specialty" />
            <Input {...register("yearsOfExperience", { required: true })} type="number" placeholder="Years of Experience" />
            <Select onValueChange={(value) => setValue("status", value)} defaultValue={selectedDoctor?.status || "ACTIVE"}>
              <SelectTrigger>
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent className="bg-white text-black">
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={(value) => setValue("clinicId", value)} defaultValue={selectedDoctor?.clinic?.id?.toString()}>
              <SelectTrigger>
                <SelectValue placeholder="Select Clinic" />
              </SelectTrigger>
              <SelectContent className="bg-white text-black">
                {clinics.map((clinic) => (
                  <SelectItem key={clinic.id} value={clinic.id.toString()}>
                    {clinic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setDialogOpen(false);
                setSelectedDoctor(null);
              }}>
                Cancel
              </Button>
              <Button type="submit">{selectedDoctor ? "Save Changes" : "Create Doctor"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
