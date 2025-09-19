"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ArrowUpDown, EditIcon, Trash } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DoctorAvailabilityStatus } from "@/lib/constants/enums";

type DoctorProfileLite = {
  id?: number;
  userId: number;
  user: { name: string };
};

type Slot = {
  id: number;
  userId: number;
  date: string; // ISO date string
  startTime: string; // "HH:MM"
  endTime: string;
  status: string;
  doctorName?: string;
};

type SlotsFormData = {
  doctorId: string | number; // stored as JSON string like appointments page
  date: string; // yyyy-mm-dd
  startTime: string;
  endTime: string;
  status: string;
};

export default function SlotsPage() {
  const TIME_REGEX = /^([01]?\d|2[0-3]):([0-5]\d)$/;
  const normalizeTimeInput = (raw: string): string => {
    const s = (raw ?? "").trim();
    if (TIME_REGEX.test(s)) return s;
    const digits = s.replace(/\D/g, "");
    if (digits.length === 4) {
      const hh = digits.slice(0, 2);
      const mm = digits.slice(2, 4);
      const H = Math.min(23, parseInt(hh || "0", 10));
      const M = Math.min(59, parseInt(mm || "0", 10));
      return `${H.toString().padStart(2, "0")}:${M.toString().padStart(2, "0")}`;
    }
    return s;
  };

  const isValidTime = (s: string) => TIME_REGEX.test((s ?? "").trim());
  const [doctors, setDoctors] = useState<DoctorProfileLite[]>([]);
  const [dataState, setDataState] = useState<{ slots: Slot[]; total: number }>({ slots: [], total: 0 });
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const { control, register, handleSubmit, reset, setValue, watch } = useForm<SlotsFormData>({
    defaultValues: { status: DoctorAvailabilityStatus.AVAILABLE },
  });

  const selectedDoctorFilter = watch("doctorId");

  const fetchDoctors = async () => {
    try {
      const res = await axios.get("/api/admin/doctors", { params: { pageSize: 1000, showActiveOnly: true } });
      return res.data?.data ?? [];
    } catch (e) {
      console.error("Failed to fetch doctors", e);
      return [] as DoctorProfileLite[];
    }
  };

  const fetchSlots = async (pageIndex: number, pageSize: number) => {
    try {
      const doctorIdParam = (() => {
        if (!selectedDoctorFilter || selectedDoctorFilter === "all") return undefined;
        try {
          // same logic as appointments page: value is JSON string with { id, doctorId }
          const parsed = typeof selectedDoctorFilter === "string" ? JSON.parse(selectedDoctorFilter) : selectedDoctorFilter;
          return parsed?.doctorId ? Number(parsed.doctorId) : Number(selectedDoctorFilter);
        } catch {
          return Number(selectedDoctorFilter);
        }
      })();

      const res = await axios.get("/api/admin/slots", {
        params: {
          page: pageIndex + 1,
          pageSize,
          doctorId: doctorIdParam,
        },
      });
      setDataState({ slots: res.data?.data ?? [], total: res.data?.total ?? 0 });
      return res.data;
    } catch (e) {
      console.error("Failed to fetch slots", e);
      setDataState({ slots: [], total: 0 });
      return { data: [], total: 0 };
    }
  };

  const createSlot = async (form: SlotsFormData) => {
    try {
      const data = { ...form } as any;
      if (typeof data.doctorId === "string") {
        try { data.doctorId = JSON.parse(data.doctorId)?.doctorId || Number(data.doctorId); } catch { /* noop */ }
      }
      data.doctorId = Number(data.doctorId);
      await axios.post("/api/admin/slots", data);
      toast.success("Slot created successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to create slot");
    }
  };

  const updateSlot = async (id: number, form: SlotsFormData) => {
    try {
      const data = { ...form } as any;
      if (typeof data.doctorId === "string") {
        try { data.doctorId = JSON.parse(data.doctorId)?.doctorId || Number(data.doctorId); } catch { /* noop */ }
      }
      data.doctorId = Number(data.doctorId);
      await axios.put(`/api/admin/slots?id=${id}`, data);
      toast.success("Slot updated successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to update slot");
    }
  };

  const deleteSlot = async (id: number) => {
    try {
      await axios.delete(`/api/admin/slots?id=${id}`);
      toast.success("Slot deleted successfully");
      await fetchSlots(pagination.pageIndex, pagination.pageSize);
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete slot");
    }
  };

  useEffect(() => {
    fetchDoctors().then((d) => setDoctors(d));
  }, []);

  const load = async () => {
    await fetchSlots(pagination.pageIndex, pagination.pageSize);
  };

  useEffect(() => {
    load();
  }, [pagination.pageIndex, pagination.pageSize, sorting, selectedDoctorFilter]);

  useEffect(() => {
    console.log("$$ Selected slot:", selectedSlot);
    console.log("$$ Doctors:", doctors);
    if (selectedSlot && doctors.length > 0) {
      // Prefill doctor using same logic as appointments page
      console.log("$$ Selected slot:", selectedSlot);
      console.log("$$ Doctors:", doctors);
      const foundDoctor = doctors.find((doc) => doc.userId === selectedSlot.userId);
      if (foundDoctor) {
        console.log("Found doctor:", foundDoctor);
        setValue("doctorId", JSON.stringify({ id: foundDoctor.id, doctorId: foundDoctor.userId }));
      }
      // Prefill date/time/status
      const d = new Date(selectedSlot.date);
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(d.getUTCDate()).padStart(2, "0");
      setValue("date", `${yyyy}-${mm}-${dd}`);
      setValue("startTime", selectedSlot.startTime);
      setValue("endTime", selectedSlot.endTime);
      setValue("status", selectedSlot.status);
    } else {
      reset({ status: DoctorAvailabilityStatus.AVAILABLE } as any);
    }
  }, [selectedSlot, doctors, setValue, reset, dialogOpen]);
  useEffect(() => {
    console.log("[Slots] selectedSlot changed:", selectedSlot);
  }, [selectedSlot]);
  const onSubmit = async (form: SlotsFormData) => {
    try {
      if (selectedSlot) {
        await updateSlot(selectedSlot.id, form);
      } else {
        await createSlot(form);
      }
      await load();
      setDialogOpen(false);
      reset({ status: DoctorAvailabilityStatus.AVAILABLE } as any);
      setSelectedSlot(null);
    } catch (e) {
      console.error(e);
    }
  };

  const columns: ColumnDef<Slot>[] = useMemo(() => [
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
      accessorFn: (row) => row.doctorName || "",
      id: "doctorName",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Doctor <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "date",
      id: "date",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Date & Time <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.original.date);
        const options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" };
        return (
          <div className="flex item-center justify-center">
            <div className="flex m-3">
              <Badge variant="outline" className="border-primary text-primary">#{row.original.id}</Badge>
            </div>
            <div className="flex flex-col items-end">
              <p className="text-muted-foreground">{date.toLocaleDateString("en-US", options)}</p>
              <p className="font-bold">{row.original.startTime} - {row.original.endTime}</p>
            </div>
          </div>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "status",
      id: "status",
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
              setSelectedSlot(row.original);
              setDialogOpen(true);
            }}
          >
            <EditIcon className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="destructive" onClick={() => deleteSlot(row.original.id)}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [deleteSlot]);

  const tableInstance = useReactTable({
    data: dataState.slots,
    columns,
    pageCount: Math.ceil(dataState.total / pagination.pageSize),
    state: { sorting, columnFilters, columnVisibility, rowSelection, pagination },
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

  return (
    <div className="container mx-auto p-4 space-y-4">
      <ToastContainer />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search doctor..."
            value={(tableInstance?.getColumn("doctorName")?.getFilterValue() as string) ?? ""}
            onChange={(event) => tableInstance?.getColumn("doctorName")?.setFilterValue(event.target.value)}
            className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white text-black" align="end">
              {tableInstance.getAllColumns().filter((column) => column.getCanHide()).map((column) => (
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

          <Controller
            control={control}
            name="doctorId"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value ? field.value.toString() : ""}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Filter by doctor" />
                </SelectTrigger>
                <SelectContent className="bg-white text-black">
                  <SelectItem value="all">All doctors</SelectItem>
                  {doctors.map((doc) => (
                    <SelectItem key={doc.userId} value={JSON.stringify({ id: doc.id, doctorId: doc.userId })}>
                      {doc.user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />

          {Object.keys(rowSelection).length > 0 && (
            <Button variant="destructive" disabled>
              Delete Selected
            </Button>
          )}
        </div>
        <div>
          <Button onClick={() => { setSelectedSlot(null); reset({ status: DoctorAvailabilityStatus.AVAILABLE } as any); setDialogOpen(true); }}>
            Add Slot
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-custom-mutedgreen text-gray-950">
            {tableInstance?.getHeaderGroups()?.map((headerGroup) => (
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
            {tableInstance?.getRowModel()?.rows?.length ? (
              tableInstance.getRowModel().rows.map((row) => (
                <TableRow className="text-center" key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
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
          {Math.min((pagination.pageIndex + 1) * pagination.pageSize, dataState.total)} of {dataState.total} slots
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${pagination.pageSize}`}
              onValueChange={(value) => setPagination((prev) => ({ ...prev, pageSize: Number(value), pageIndex: 0 }))}
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
              onClick={() => tableInstance.previousPage()}
              disabled={!tableInstance.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => tableInstance.nextPage()}
              disabled={!tableInstance.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedSlot ? "Edit Slot" : "Create Slot"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Controller
              control={control}
              name="doctorId"
              rules={{ required: true }}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ? field.value.toString() : ""}>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input type="date" {...register("date", { required: true })} />
              </div>
              <div>
                <label className="text-sm font-medium">Start Time</label>
                <Input
                  placeholder="HH:MM"
                  inputMode="numeric"
                  {...register("startTime", {
                    required: true,
                    validate: (v) => isValidTime(v) || "Invalid time (HH:MM)",
                  })}
                  onBlur={(e) => setValue("startTime", normalizeTimeInput(e.target.value), { shouldValidate: true })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">End Time</label>
                <Input
                  placeholder="HH:MM"
                  inputMode="numeric"
                  {...register("endTime", {
                    required: true,
                    validate: (v) => isValidTime(v) || "Invalid time (HH:MM)",
                  })}
                  onBlur={(e) => setValue("endTime", normalizeTimeInput(e.target.value), { shouldValidate: true })}
                />
              </div>
            </div>

            <Controller
              control={control}
              name="status"
              rules={{ required: true }}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-black">
                    <SelectItem value={DoctorAvailabilityStatus.AVAILABLE}>Available</SelectItem>
                    <SelectItem value={DoctorAvailabilityStatus.BOOKED}>Booked</SelectItem>
                    <SelectItem value={DoctorAvailabilityStatus.BLOCKED}>Blocked</SelectItem>
                    <SelectItem value={DoctorAvailabilityStatus.CANCELLED}>Cancelled</SelectItem>
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
                  setSelectedSlot(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">{selectedSlot ? "Save Changes" : "Create Slot"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


