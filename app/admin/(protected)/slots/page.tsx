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
import { ChevronDown, ArrowUpDown, EditIcon, Trash, CalendarIcon, DoorClosedIcon } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

// Import the new TimePicker component
import { TimeInput } from "@/components/ui/custom/cd-date-time-picker";

interface DoctorAvailabilityResponse {
  data: DoctorAvailability[];
  total: number;
}

interface DoctorAvailability {
  id: number;
  doctorId: number;
  doctorName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
}

const fetchDoctorAvailability = async (pageIndex: number, pageSize: number): Promise<DoctorAvailabilityResponse> => {
  try {
    const response = await axios.get(`/api/admin/slots?page=${pageIndex + 1}&pageSize=${pageSize}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch doctor availability:", error);
    return { data: [], total: 0 };
  }
};

const fetchDoctors = async () => {
  try {
    const [doctorRes] = await Promise.all([
      axios.get("/api/admin/doctors?showActiveOnly=true"),
    ]);

    const doctors = doctorRes.data.data || [];

    return doctors;
  } catch (error) {
    console.error("Failed to fetch doctors and dieticians:", error);
    return [];
  }
};

interface CreateDoctorAvailabilityData {
  doctorId: number;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
}

const createDoctorAvailability = async (data: CreateDoctorAvailabilityData): Promise<DoctorAvailability | null> => {
  console.log("Data for booking is ", data);
  if (typeof data.doctorId === "string") {
    try {
      data.doctorId = JSON.parse(data.doctorId)?.id || Number(data.doctorId);
    } catch (error) {
      console.error("Error parsing doctorId:", error);
    }
  } 
  const payload = {
    ...data,
    doctorId: Number(data.doctorId),
  };
  try {
    const response = await axios.post("/api/admin/slots", payload);
    return response.data;
  } catch (error) {
    console.error("Failed to create doctor availability:", error);
    return null;
  }
};

interface UpdateDoctorAvailabilityData {
  doctorId: number;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
}

const updateDoctorAvailability = async (id: number, data: UpdateDoctorAvailabilityData): Promise<DoctorAvailability | null> => {
  // doctorId may come through as a JSON‑stringified object from the <Select>
  if (typeof data.doctorId === "string") {
    try {
      data.doctorId = JSON.parse(data.doctorId)?.id || Number(data.doctorId);
    } catch (error) {
      console.error("Error parsing doctorId:", error);
    }
  }
  const payload = {
    ...data,
    doctorId: Number(data.doctorId),
  };

  try {
    const response = await axios.put(`/api/admin/slots?id=${id}`, payload);
    return response.data;
  } catch (error) {
    console.error("Failed to update doctor availability:", error);
    return null;
  }
};

interface DeleteDoctorAvailabilityResponse {
  success: boolean;
  message: string;
}

const deleteDoctorAvailability = async (id: number): Promise<DeleteDoctorAvailabilityResponse | null> => {
  try {
    const response = await axios.delete(`/api/admin/slots?id=${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete doctor availability:", error);
    return null;
  }
};

const convertToIST = (date: string) => {
  const utcDate = new Date(date); // Convert to Date object (UTC)
  return format(utcDate, 'dd/MM/yyyy'); // Format the date to display in IST
};

export default function DoctorAvailabilityPage() {
  const [data, setData] = useState<{ availabilities: DoctorAvailability[], total: number }>({ availabilities: [], total: 0 });
  const [doctors, setDoctors] = useState<{ id: number; userId:number; user: { name: string } }[]>([]);

  const [selectedAvailability, setSelectedAvailability] = useState<DoctorAvailability | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { register, handleSubmit, reset, setValue, control } = useForm<FormData>();
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
      accessorKey: "id",
      id: "id",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          ID <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true
    },
    {
      accessorKey: "doctorName",
      id: "doctor.name",
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
      // cell: ({ row }) => new Date(row.getValue("date")).toLocaleDateString(),
      cell: ({ row }) => convertToIST(row.getValue("date")),  // Convert and format date to IST

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
              setValue("doctorId", row.original.doctorId);
              setValue("date", row.original.date);
              setValue("startTime", row.original.startTime);
              setValue("endTime", row.original.endTime);
              setValue("status", row.original.status);
              setDialogOpen(true);
            }}
          >
            <EditIcon className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={async () => {
              await deleteDoctorAvailability(row.original.id);
              await fetchData(); // refresh the table data
                            toast.success("Slot deleted successfully");
            }}
          >
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
    fetchDoctors().then((docs) => {
      console.log("Doctors loaded", docs);
      setDoctors(docs);
    });
  }, []);

  useEffect(() => {
    if (selectedAvailability) {
      setValue("doctorId", selectedAvailability.doctorId); // Use doctorId instead of doctorName
      setValue("date", selectedAvailability.date);
      setValue("startTime", selectedAvailability.startTime);
      setValue("endTime", selectedAvailability.endTime);
      setValue("status", selectedAvailability.status);
    } else {
      reset();
    }
  }, [selectedAvailability, setValue, reset]);

  interface FormData {
    doctorId: number;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
  }

  const onSubmit = async (formData: FormData) => {
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
    if (selectedIds.length === 0) {
      toast.info("No availabilities selected");
      return;
    }
    // Call deleteDoctorAvailability for each selected ID sequentially or batch
    // Since deleteDoctorAvailability only deletes one ID, let's do Promise.all:
    await Promise.all(selectedIds.map((id) => deleteDoctorAvailability(id)));
    
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
          <Button onClick={() => {
            setSelectedAvailability(null);
            reset();  // optional: clear form state
            setDialogOpen(true);
          }
          }>Add Slots</Button>
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
            {/* Doctor Dropdown */}
            <Controller
              control={control}
              name="doctorId"
              rules={{ required: true }}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value?.toString()}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Doctor" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-black">
                  {doctors.map((doc) => (
                      <SelectItem key={doc.userId} value={JSON.stringify({ id: doc.id, doctorId: doc.userId })}>
                        {doc.user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {/* Date Picker */}
            <Controller
              control={control}
              name="date"
              rules={{ required: true }}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => {
                        // Format the date as YYYY-MM-DD before setting it
                        const formattedDate = date ? format(date, 'yyyy-MM-dd') : undefined;
                        field.onChange(formattedDate);
                      }}
                      initialFocus
                      className="bg-white text-black"
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {/* Use TimePicker for startTime */}
            <Controller
              name="startTime"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <TimeInput
                  value={field.value} // expects a string like "10:00 AM"
                  onChange={(newTime) => field.onChange(newTime)}
                />
              )}
            />
            {/* Use TimePInputfor endTime */}
            <Controller
              name="endTime"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <TimeInput
                  value={field.value} // expects a string like "10:00 AM"
                  onChange={(newTime) => field.onChange(newTime)}
                />
              )}
            />
            <Controller
              name="status"
              control={control}
              defaultValue="available"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-black">
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="booked">booked</SelectItem>
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
              <Button type="submit">
                {selectedAvailability ? "Save Changes" : "Create Availability"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}