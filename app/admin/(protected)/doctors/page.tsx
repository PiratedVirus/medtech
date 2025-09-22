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
import { ChevronDown, ArrowUpDown, EditIcon, Trash, Copy, Check, LayoutGrid, Table as TableIcon } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

// Types for doctor profile data and related user
type Doctor = {
  id: number;
  specialty: string;
  yearsOfExperience: number;
  consultationFee: number;
  createdAt: string;
  isDietician: boolean;
  doctorCode: string | null;
  // Relation from doctorProfile to user
  user: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
    status: string;
    clinic?: { id: number | null; name: string };
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
  isDietician: boolean;
  doctorCode: string;
  supportsVideo?: boolean;
  supportsClinic?: boolean;
};

export default function DoctorsPage() {
  const [data, setData] = useState<{ doctors: Doctor[]; total: number }>({ doctors: [], total: 0 });
  const [clinics, setClinics] = useState<{ id: number; name: string }[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [roleCounts, setRoleCounts] = useState<{ [key: string]: number }>({});
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
  const [referralLink, setReferralLink] = useState<string>("");
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const router = useRouter();

  // Watch clinicId to filter available users
  const selectedClinicId = watch("clinicId");

  const fetchAvailableUsers = async (clinicId: number) => {
    try {
      // This endpoint should return users for the specified clinic
      const res = await axios.get(`/api/admin/optimized/users?role=DOCTOR`);
      console.log("Available users for clinic:", res.data.data);
      setAvailableUsers(res.data.data);
    } catch (error) {
      console.error("Error fetching available users:", error);
      toast.error("Failed to fetch users for selected clinic");
    }
  };

  useEffect(() => {
    if (selectedClinicId) {
      fetchAvailableUsers(selectedClinicId);
    } else {
      setAvailableUsers([]);
    }
  }, [selectedClinicId]);

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
              // Pre-fill form with existing data
              setValue("specialty", row.original.specialty);
              setValue("yearsOfExperience", row.original.yearsOfExperience);
              setValue("consultationFee", row.original.consultationFee);
              setValue("status", row.original.user.status);
              setValue("clinicId", row.original.user.clinic?.id ?? 0);
              setValue("userId", row.original.user.id);
              setValue("isDietician", row.original.isDietician || false);
              setValue("doctorCode", row.original.doctorCode || "");
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
      setClinics(clinicsRes.data.data);
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
      setValue("specialty", selectedDoctor.specialty);
      setValue("yearsOfExperience", selectedDoctor.yearsOfExperience);
      setValue("consultationFee", selectedDoctor.consultationFee);
      setValue("status", selectedDoctor.user.status);
      setValue("userId", selectedDoctor.user.id);
      setValue("isDietician", selectedDoctor.isDietician || false);
      setValue("doctorCode", selectedDoctor.doctorCode || "");
    } else {
      reset();
    }
  }, [selectedDoctor, setValue, reset]);

  const onSubmit = async (formData: DoctorsPageFormData) => {
    console.log("submitting with form data:", formData);
    try {
      const payload = {
        ...formData,
        yearsOfExperience: Number(formData.yearsOfExperience),
        consultationFee: Number(formData.consultationFee),
        isDietician: formData.isDietician || false,
        doctorCode: formData.doctorCode.toUpperCase(),
        supportsVideo: formData.supportsVideo ?? true,
        supportsClinic: formData.supportsClinic ?? true,
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

  const generateReferralLink = async (doctorCode: string) => {
    try {
      setIsGeneratingLink(true);
      const response = await axios.post("/api/admin/doctors/generate-referral-link", {
        doctorCode
      });
      if (response.data.success) {
        setReferralLink(response.data.referralLink);
      } else {
        toast.error(response.data.error || "Failed to generate referral link");
      }
    } catch (error) {
      console.error("Error generating referral link:", error);
      toast.error("Failed to generate referral link");
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const DoctorCard = ({ doctor }: { doctor: Doctor }) => (
    <Card className="hover:shadow-lg bg-custom-mutedgreen transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-semibold">{doctor.user.name}</CardTitle>
            <p className="text-sm text-gray-500">{doctor.user.email}</p>
          </div>
          <Badge variant={doctor.user.status === "ACTIVE" ? "secondary" : "destructive"}>
            {doctor.user.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Specialty:</span>
            <span className="font-medium">{doctor.specialty}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Experience:</span>
            <span className="font-medium">{doctor.yearsOfExperience} years</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Consultation Fee:</span>
            <span className="font-medium">₹{doctor.consultationFee}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Clinic:</span>
            <span className="font-medium">{doctor.user.clinic?.name || "N/A"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Doctor Code:</span>
            <span className="font-medium">{doctor.doctorCode || "Not set"}</span>
          </div>
        </div>
        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          {/* Left: View Details */}
          <Button
            size="sm"
            variant="outline"
            className="bg-transparent text-custom-darkgreen border-0 shadow-none"
            onClick={() => router.push(`/admin/doctors/${doctor.id}`)}
          >
            View Details
          </Button>
          {/* Right: Edit and Delete */}
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-transparent text-primary border-0 shadow-none"
              onClick={() => {
                setSelectedDoctor(doctor);
                setValue("specialty", doctor.specialty);
                setValue("yearsOfExperience", doctor.yearsOfExperience);
                setValue("consultationFee", doctor.consultationFee);
                setValue("status", doctor.user.status);
                setValue("clinicId", doctor.user.clinic?.id ?? 0);
                setValue("userId", doctor.user.id);
                setValue("isDietician", doctor.isDietician || false);
                setValue("doctorCode", doctor.doctorCode || "");
                setDialogOpen(true);
              }}
            >
              <EditIcon className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              className="bg-transparent text-primary border-0 shadow-none"
              onClick={() => deleteDoctor(doctor.id)}
            >
              <Trash className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-4 bg-white space-y-4">
      <ToastContainer />
      {/* Header Section */}

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
        {/* Right group */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === "table" ? "card" : "table")}
            title={viewMode === "table" ? "Switch to Card View" : "Switch to Table View"}
          >
            {viewMode === "table" ? <LayoutGrid className="h-4 w-4" /> : <TableIcon className="h-4 w-4" />}
          </Button>
          <Button onClick={() => setDialogOpen(true)}>Add Doctor</Button>
        </div>
      </div>

      {/* View Content */}
      {viewMode === "table" ? (
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {viewMode === "table" && (
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
      )}

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
                      {Array.isArray(clinics) && clinics.map((clinic) => (
                        <SelectItem key={clinic.id} value={clinic.id.toString()}>
                          {clinic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* User Dropdown (filtered by clinic) */}
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
            <Controller
              control={control}
              name="isDietician"
              defaultValue={false}
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDietician"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isDietician" className="text-sm font-medium">
                    Mark as Dietician
                  </label>
                </div>
              )}
            />
            {/* Consultation types */}
            <div className="space-y-2">
              <div className="font-medium">Consultation Availability</div>
              <div className="flex items-center gap-6">
                <Controller
                  control={control}
                  name="supportsVideo"
                  defaultValue={true}
                  rules={{ validate: () => (watch('supportsVideo') || watch('supportsClinic')) || 'Select at least one' }}
                  render={({ field }) => (
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={!!field.value} onChange={(e)=> field.onChange(e.target.checked)} className="w-4 h-4" />
                      Video / Online consultation
                    </label>
                  )}
                />
                <Controller
                  control={control}
                  name="supportsClinic"
                  defaultValue={true}
                  rules={{ validate: () => (watch('supportsVideo') || watch('supportsClinic')) || 'Select at least one' }}
                  render={({ field }) => (
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={!!field.value} onChange={(e)=> field.onChange(e.target.checked)} className="w-4 h-4" />
                      Physical / Clinic consultation
                    </label>
                  )}
                />
              </div>
              {!(watch('supportsVideo') || watch('supportsClinic')) && (
                <div className="text-xs text-red-600">Select at least one consultation mode</div>
              )}
            </div>
            <Input
              {...register("doctorCode", {
                required: true,
                pattern: {
                  value: /^[A-Z0-9]{6}$/,
                  message: "Doctor code must be 6 characters long and contain only uppercase letters and numbers"
                }
              })}
              placeholder="Doctor Code (6 characters)"
              maxLength={6}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();
                setValue("doctorCode", value);
                setReferralLink(""); // Clear referral link when code changes
              }}
            />
            {selectedDoctor && (
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => generateReferralLink(selectedDoctor.doctorCode || "")}
                  disabled={isGeneratingLink || !selectedDoctor.doctorCode}
                >
                  {isGeneratingLink ? "Generating..." : "Generate Referral Link"}
                </Button>
                {referralLink && (
                  <div className="flex items-center gap-2 p-2 border rounded-md bg-gray-50">
                    <Input
                      value={referralLink}
                      readOnly
                      className="flex-1 bg-transparent border-0 focus-visible:ring-0"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(referralLink)}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setSelectedDoctor(null);
                  setReferralLink("");
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