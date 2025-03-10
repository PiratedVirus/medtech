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
import { useQuery, useMutation, useQueryClient } from 'react-query';
import CdLoader from "@/components/ui/custom/cd-loader";

// Types for doctor profile data and related user
type Doctor = {
  id: number;
  specialty: string;
  yearsOfExperience: number;
  consultationFee: number;
  createdAt: string;
  // Relation from doctorProfile to user
  user: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
    status: string;
    clinic?: { id: number; name: string };
  };
};

type User = {
  id: number;
  name: string;
  email: string;
};

type DoctorsPageFormData = {
  userId: number;
  specialty: string;
  yearsOfExperience: number;
  consultationFee: number;
  status: string;
  clinicId: number;
};

export default function DoctorsPage() {
  const queryClient = useQueryClient();
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    watch,
  } = useForm<DoctorsPageFormData>();
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const fetchAvailableUsers = async (clinicId: number) => {
    try {
      const res = await axios.get(`/api/admin/users?clinicId=${clinicId}`);
      return res.data.data;
    } catch (error) {
      console.error("Error fetching available users:", error);
      toast.error("Failed to fetch users for selected clinic");
      return [];
    }
  };

  const fetchDoctors = async (pageIndex: number, pageSize: number) => {
    try {
      const response = await axios.get(
        `/api/admin/doctors?page=${pageIndex + 1}&pageSize=${pageSize}`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
      return { data: [], total: 0 };
    }
  };

  const fetchClinics = async () => {
    try {
      const response = await axios.get("/api/admin/clinics");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch clinics:", error);
      return [];
    }
  };

  const { data: availableUsers, isLoading: usersLoading } = useQuery(['availableUsers', watch("clinicId")], () => fetchAvailableUsers(watch("clinicId")), {
    enabled: !!watch("clinicId"),
  });

  const { data: doctorsData, isLoading: doctorsLoading } = useQuery(['doctors', pagination.pageIndex, pagination.pageSize], () => fetchDoctors(pagination.pageIndex, pagination.pageSize));

  const { data: clinics, isLoading: clinicsLoading } = useQuery('clinics', fetchClinics);

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
      accessorFn: (row) => row.user?.name,
      id: "user.name",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
    },
    {
      accessorFn: (row) => row.user?.email,
      id: "user.email",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Email <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
    },
    {
      accessorFn: (row) => row.user?.phoneNumber,
      id: "user.phoneNumber",
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
      accessorKey: "consultationFee",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Consultation Fee <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
    },
    {
      accessorFn: (row) => row.user?.status,
      id: "user.status",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Status <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
    },
    {
      accessorFn: (row) => row.user?.clinic?.name,
      id: "user.clinic.name",
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
              setValue("specialty", row.original.specialty);
              setValue("yearsOfExperience", row.original.yearsOfExperience);
              setValue("consultationFee", row.original.consultationFee);
              setValue("status", row.original.user.status);
              setValue("clinicId", row.original.user.clinic?.id);
              setValue("userId", row.original.user.id);
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
    data: doctorsData?.data || [],
    columns,
    pageCount: Math.ceil(doctorsData?.total / pagination.pageSize),
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

  useEffect(() => {
    if (selectedDoctor) {
      setValue("specialty", selectedDoctor.specialty);
      setValue("yearsOfExperience", selectedDoctor.yearsOfExperience);
      setValue("consultationFee", selectedDoctor.consultationFee);
      setValue("status", selectedDoctor.user.status);
      setValue("clinicId", selectedDoctor.user.clinic?.id);
      setValue("userId", selectedDoctor.user.id);
    } else {
      reset();
    }
  }, [selectedDoctor, setValue, reset]);

  const onSubmit = async (formData: DoctorsPageFormData) => {
    console.log("submitting with form data:", formData);
    try {
      const payload = {
        ...formData,
        clinicId: formData.clinicId ? Number(formData.clinicId) : null,
        yearsOfExperience: Number(formData.yearsOfExperience),
        consultationFee: Number(formData.consultationFee),
      };

      if (selectedDoctor) {
        await axios.put("/api/admin/doctors", { id: selectedDoctor.id, ...payload });
        toast.success("Doctor updated successfully");
      } else {
        await axios.post("/api/admin/doctors", payload);
        toast.success("Doctor created successfully");
      }

      queryClient.invalidateQueries('doctors');
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
      queryClient.invalidateQueries('doctors');
    } catch (error) {
      console.error("Error deleting doctor:", error);
      toast.error("Failed to delete doctor");
    }
  };

  const deleteSelected = async () => {
    const selectedIds = Object.keys(rowSelection).map(
      (index) => doctorsData.data[parseInt(index)].id
    );
    try {
      await axios.delete("/api/admin/doctors", { data: { ids: selectedIds } });
      toast.success("Selected doctors deleted successfully");
      queryClient.invalidateQueries('doctors');
      setRowSelection({});
    } catch (error) {
      console.error("Error deleting doctors:", error);
      toast.error("Failed to delete selected doctors");
    }
  };

  if (doctorsLoading || clinicsLoading || usersLoading) {
    return <CdLoader />;
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <ToastContainer />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg bg-custom-mutedgreen items-end flex flex-col">
          <h3 className="text-lg font-semibold">Total Doctors</h3>
          <p className="text-3xl text-primary">{doctorsData?.roleCounts.DOCTOR || 0}</p>
        </div>
        <div className="p-4 border rounded-lg bg-custom-mutedgreen items-end flex flex-col">
          <h3 className="text-lg font-semibold">Total Lab Technicians</h3>
          <p className="text-3xl text-primary">{doctorsData?.roleCounts.LAB_TECH || 0}</p>
        </div>
        <div className="p-4 border rounded-lg bg-custom-mutedgreen items-end flex flex-col">
          <h3 className="text-lg font-semibold">Total Patients</h3>
          <p className="text-3xl text-primary">{doctorsData?.roleCounts.PATIENT || 0}</p>
        </div>
        <div className="p-4 border rounded-lg bg-custom-mutedgreen items-end flex flex-col">
          <h3 className="text-lg font-semibold">Total Users</h3>
          <p className="text-3xl text-primary">{doctorsData?.total}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search doctors..."
            value={(table.getColumn("user.name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("user.name")?.setFilterValue(event.target.value)
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
          <Button onClick={() => setDialogOpen(true)}>Add Doctor</Button>
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
          {Math.min((pagination.pageIndex + 1) * pagination.pageSize, doctorsData.total)} of {doctorsData.total} doctors
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
            <div>
              <label className="block font-medium">Select Clinic</label>
              <Controller
                control={control}
                name="clinicId"
                rules={{ required: true }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value ? field.value.toString() : ""}>
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
                )}
              />
            </div>
            <div>
              <label className="block font-medium">Select User</label>
              <Controller
                control={control}
                name="userId"
                rules={{ required: true }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value ? field.value.toString() : ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select User" />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-black">
                      {availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <Input {...register("specialty", { required: true })} placeholder="Specialty" />
            <Input
              {...register("yearsOfExperience", { required: true })}
              type="number"
              placeholder="Years of Experience"
            />
            <Input
              {...register("consultationFee", { required: true })}
              type="number"
              placeholder="Consultation Fee"
            />
            <Controller
              control={control}
              name="status"
              defaultValue="ACTIVE"
              rules={{ required: true }}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-black">
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
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
                  setSelectedDoctor(null);
                }}
              >
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
