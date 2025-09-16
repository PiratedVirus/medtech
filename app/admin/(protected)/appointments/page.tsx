"use client";
import DailyIframe, { DailyCall } from '@daily-co/daily-js';

import { useState, useEffect } from "react";
import axios from "axios";
import { useForm, Controller } from "react-hook-form";
import { ConsultationType, AppointmentStatus } from "@/lib/constants/enums";
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
import { Badge } from "@/components/ui/badge";
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
import { set } from "date-fns";
import Link from "next/link";

// --- Types ---
type Appointment = {
  id: number;
  patient: string;
  userId: number;
  doctorAvailabilityId: number;
  status: string;
  createdAt: string;
  doctorName: string;
  startTime: string;
  endTime: string;
  doctorAvailability: { date: string; }
  fullName: string;
  consultationType: string;
  appointmentLink: string;
  meetingRoomLink: string;
  ownerToken1: string;
  ownerToken2: string;
  // Relations

};

type Doctor = {
  id?: number;
  userId: number;
  user: {
    name: string;
  };
};

type Patient = any;

// type Patient = {
//   id: number;

//   user: {
//     name: string;
//   };
// };

type Slot = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
};

type AppointmentsFormData = {
  patientId: number;
  doctorId: string | number;
  doctorAvailabilityId: number | string;
  status: string;
  consultationType: string;
  startTime: string;
  endTime: string;
  doctorAvailability: { date: string; }
  patinetName: string;
  patientEmail: string;
  patientPhone: string;
};

// --- API Functions ---


const updateAppointment = async (id: number, data: AppointmentsFormData) => {
  try {
    const dataWIthId = {
      ...data,
      id: Number(id),
    }
    const response = await axios.put(`/api/admin/optimized/appointments`, dataWIthId);
    return response.data;
  } catch (error) {
    console.error("Failed to update appointment:", error);
    return null;
  }
};



const fetchDoctors = async () => {
  try {
    const response = await axios.get("/api/admin/doctors");
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch doctors:", error);
    return [];
  }
};

const fetchAvailableSlots = async (doctorId: number) => {
  try {
    const response = await axios.get(`/api/admin/appointments/available-slots?id=${doctorId}&checkAvailability=false`);
    console.log("Available slots:", response.data);
    // Assume response is { data: Slot[] }
    return response.data;
  } catch (error) {
    console.error("Failed to fetch available slots:", error);
    return [];
  }
};


// --- Component ---
export default function AppointmentsPage() {
  const [dataState, setDataState] = useState<{ appointments: Appointment[]; total: number }>({
    appointments: [],
    total: 0,
  });
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activeCallFrame, setActiveCallFrame] = useState<DailyCall | null>(null);

  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [meetingDetails, setMeetingDetails] = useState<{ meetingRoomLink: string; token: string } | null>(null);


  useEffect(() => {
    // This function runs when the component unmounts
    return () => {
      if (activeCallFrame) {
        console.log('AppointmentsPage unmounting, destroying active call frame.');
        activeCallFrame.destroy();
        // No need to setActiveCallFrame(null) here as the component is gone
      }
      // If using ref:
      // if (activeCallFrameRef.current) {
      //   activeCallFrameRef.current.destroy();
      // }
    };
  }, [activeCallFrame]);

  const createAppointment = async (data: AppointmentsFormData, availableSlots: any) => {
    console.log("Creating appointment with formData:", data);
    console.log("doctorId:", data.doctorId);
    if (typeof data.doctorId === "string") {
      try {
        data.doctorId = JSON.parse(data.doctorId)?.doctorId || Number(data.doctorId);
      } catch (error) {
        console.error("Error parsing doctorId:", error);
      }
    }    // Convert doctorAvailabilityId to number before comparison
    const slot = availableSlots.find(
      (slot: any) => slot.id === Number(data.doctorAvailabilityId) // Convert to number
    );

    const selectedPatient = patients.find((pat) => pat.id === Number(data.patientId));
    console.log("Selected patient:", selectedPatient);
    if (!selectedPatient) {
      console.error("Patient not found!");
      return null;
    }
    data.patinetName = selectedPatient.name;
    data.patientEmail = selectedPatient.email;
    data.patientPhone = selectedPatient.phoneNumber;

    if (!slot) {
      console.error("Slot not found!");
      return null;
    }
    console.log("Slot found:", slot);

    const payload = {
      ...data,
      startTime: slot.startTime,
      endTime: slot.endTime,
      doctorAvailability: { date: slot.date },
      doctorId: Number(data.doctorId),
      patientId: Number(data.patientId),
      doctorAvailabilityId: Number(data.doctorAvailabilityId),
      consultationType: data.consultationType,
    };
    console.log("Entire payload", payload);

    try {
      const response = await axios.post("/api/admin/optimized/appointments", payload);
      return response.data;
    } catch (error) {
      console.error("Failed to create appointment:", error);
      return null;
    }
  };


  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    watch,
  } = useForm<AppointmentsFormData>({
    defaultValues: { status: "Scheduled" },
  });
  const [sorting, setSorting] = useState<SortingState>([{ id: "doctorAvailability.date", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const fetchAppointments = async (pageIndex: number, pageSize: number) => {
    try {
      const response = await axios.get(
        `/api/admin/optimized/appointments?page=${pageIndex + 1}&pageSize=${pageSize}`
      );
      setDataState({ appointments: response.data.data, total: response.data.total });

      return response.data;
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
      return { data: [], total: 0 };
    }
  };
  const deleteAppointment = async (id: number) => {
    try {
      await axios.delete(`/api/admin/appointments?id=${id}`);
      toast.success("Appointment deleted successfully");
      // Immediately update local state by filtering out the deleted appointment
      setDataState((data) => ({
        ...data,
        appointments: data.appointments.filter((appt) => appt.id !== id),
        total: data.total - 1,
      }));
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast.error("Failed to delete appointment");
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await axios.get("/api/admin/optimized/users?role=PATIENT");
      return response.data.data;
    } catch (error) {
      console.error("Failed to fetch patients:", error);
      return [];
    }
  };

  useEffect(() => {
    fetchPatients().then((pats) => setPatients(pats));
  }, []);

  // Watch selected doctor from form
  const selectedDoctorId = watch("doctorId");


  // When a doctor is selected, load available slots for that doctor
  useEffect(() => {
    if (selectedDoctorId) {
      // @ts-ignore
      const sendThisDoctorId = JSON.parse(selectedDoctorId).doctorId;

      fetchAvailableSlots(Number(sendThisDoctorId)).then((slots: Slot[]) => {
        // If editing an appointment, ensure the current appointment's slot is included
        if (selectedAppointment) {
          const currentSlot = {
            id: selectedAppointment.doctorAvailabilityId,
            date: selectedAppointment.doctorAvailability.date,
            startTime: selectedAppointment.startTime,
            endTime: selectedAppointment.endTime,
            status: "booked"
          };
          
          // Check if current slot is already in the slots array
          const slotExists = slots.some(slot => slot.id === currentSlot.id);
          if (!slotExists) {
            slots.push(currentSlot);
          }
        }
        
        setAvailableSlots(slots);
      });
    } else {
      setAvailableSlots([]);
    }
  }, [selectedDoctorId, selectedAppointment]);

  // Load doctors on mount
  useEffect(() => {
    fetchDoctors().then((docs) => {
      console.log("Doctors loaded", docs);
      setDoctors(docs);
    });
  }, []);

  // Fetch appointments data
  const fetchData = async () => {
    try {
      const result = await fetchAppointments(pagination.pageIndex, pagination.pageSize);
      setDataState({ appointments: result.data || [], total: result.total || 0 });
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setDataState({ appointments: [], total: 0 });
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.pageIndex, pagination.pageSize, sorting]);

  // When editing an appointment, pre-fill form values
  useEffect(() => {
    if (selectedAppointment && doctors.length > 0 && patients.length > 0) {
      console.log("Selected appointment:", selectedAppointment);
      // 1. Prefill 'patientId'
      const foundPatient = patients.find(
        (p) => p.name === selectedAppointment.fullName || p.name === selectedAppointment.patient
      );
      if (foundPatient) {
        setValue("patientId", foundPatient.id.toString());
      }

      // 2. Prefill 'doctorId' (JSON string)
      const foundDoctor = doctors.find(
        (doc) => doc.userId === selectedAppointment.userId
      );
      if (foundDoctor) {
        setValue(
          "doctorId",
          JSON.stringify({ id: foundDoctor.id, doctorId: foundDoctor.userId })
        );
      }

      // 3. Prefill the slot
      setValue(
        "doctorAvailabilityId",
        selectedAppointment.doctorAvailabilityId.toString()
      );

      // 4. Prefill consultationType
      if (selectedAppointment.consultationType) {
        setValue(
          "consultationType",
          selectedAppointment.consultationType.toString()
        );
      }

      // 5. Prefill status
      setValue("status", selectedAppointment.status);
    } else {
      reset();
    }
  }, [selectedAppointment, doctors, patients, setValue, reset]);

  const onSubmit = async (formData: AppointmentsFormData) => {
    console.log("Form data in app book:", formData);
    try {
      if (selectedAppointment) {
        await updateAppointment(selectedAppointment.id, formData);
        toast.success("Appointment updated successfully");
      } else {
        await createAppointment(formData, availableSlots);
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
      (index) => dataState.appointments[parseInt(index)].id
    );
    try {
      await axios.delete("/api/admin/optimized/appointments", { data: { ids: selectedIds } });
      toast.success("Selected appointments deleted successfully");
      await fetchData();
      setRowSelection({});
    } catch (error) {
      console.error("Error deleting appointments:", error);
      toast.error("Failed to delete selected appointments");
    }
  };

  const columns: ColumnDef<Appointment>[] = [
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
      accessorFn: (row) => row.doctorName,
      id: "doctorName",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Doctor <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "doctorAvailability.date",
      id: "doctorAvailability.date",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Date & Time <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.original.doctorAvailability.date);
        // const options = { day: '2-digit', month: 'short', year: 'numeric' };
        const options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" };
        return (
          <>
            {/* <div className="flex items-center gap-2">
            <span>
              {date.toLocaleDateString('en-US', options)} •
              {row.original.startTime} - {row.original.endTime}
            </span>
            <Badge variant="outline" className="border-primary text-primary">
              #{row.original.doctorAvailabilityId}
            </Badge>
          </div> */}
            <div className="flex item-center justify-center">
              <div className="flex m-3">
                <Badge variant="outline" className="border-primary text-primary">
                  #{row.original.doctorAvailabilityId}
                </Badge>
              </div>
              <div className="flex flex-col items-end">
                <p className="text-muted-foreground">{date.toLocaleDateString('en-US', options)}</p>
                <p className="font-bold"> {row.original.startTime} - {row.original.endTime}</p>
              </div>
            </div>
          </>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "consultationType",
      id: "consultationType",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Consultation Type <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        if (row.original.consultationType === ConsultationType.VIDEO) {
          return (
            <Button
              className="bg-transparent shadow-none"
              onClick={async () => { // Make onClick async if needed for join promise
                if (row.original.meetingRoomLink && row.original.ownerToken1) {

                  // --- Destroy existing frame if any ---
                  if (activeCallFrame) {
                    console.log('Destroying previous call frame before starting new one.');
                    await activeCallFrame.destroy(); // Wait for destruction if needed
                    setActiveCallFrame(null);
                  }
                  // If using ref:
                  // if (activeCallFrameRef.current) {
                  //   await activeCallFrameRef.current.destroy();
                  //   activeCallFrameRef.current = null;
                  // }

                  console.log('Creating and joining new call frame...');
                  // @ts-ignore
                  const newCallFrame = DailyIframe.createFrame({
                    iframeStyle: {
                      alignItems: 'center',
                      display: 'flex',
                      justifyContent: 'center',
                      position: 'fixed',
                      top: '10%',
                      left: '10%',
                      width: '80%',
                      height: '80%',
                      zIndex: 1000,
                      borderRadius: '8px',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    },
                    showLeaveButton: true,
                    showFullscreenButton: true
                  });

                  // --- Add listener to destroy frame on leaving ---
                  newCallFrame.on('left-meeting', () => {
                    console.log('Call frame event: left-meeting. Destroying frame.');
                    newCallFrame.destroy();
                    setActiveCallFrame(null); // Clear the state
                    // If using ref: activeCallFrameRef.current = null;
                  });

                  // Optional: Handle errors during the call
                  newCallFrame.on('error', (error) => {
                    console.error('Daily call error:', error);
                    toast.error(`Video call error: ${error?.errorMsg || 'Unknown error'}`);
                    newCallFrame.destroy(); // Destroy frame on error too
                    setActiveCallFrame(null);
                    // If using ref: activeCallFrameRef.current = null;
                  });

                  // --- Store the new frame ---
                  setActiveCallFrame(newCallFrame);
                  // If using ref: activeCallFrameRef.current = newCallFrame;

                  // --- Join the call ---
                  try {
                    await newCallFrame.join({
                      url: row.original.meetingRoomLink,
                      token: row.original.ownerToken1
                    });
                    console.log('Successfully joined call');
                  } catch (error) {
                    console.error("Failed to join Daily call:", error);
                    toast.error("Failed to join video call.");
                    // If join fails, destroy the frame immediately
                    newCallFrame.destroy();
                    setActiveCallFrame(null);
                    // If using ref: activeCallFrameRef.current = null;
                  }

                } else {
                  console.error("Meeting link or owner token is missing.");
                  toast.error("Cannot start video call: Missing meeting details.");
                }
              }}
            >
              <Badge className="bg-green-700 shadow-none text-white">
                JOIN MEET
              </Badge>
            </Button>
          );
        }
        return ConsultationType.PHYSICAL;
      }
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
              setSelectedAppointment(row.original);
              console.log("Selected appointment on edit click:", row.original);
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
  console.log("Data state:", dataState.appointments);
  const tableInstance = useReactTable({
    data: dataState.appointments,
    columns,
    pageCount: Math.ceil(dataState.total / pagination.pageSize),
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

  const formatSlotDisplay = (slotId: string | number) => {
    const slot = availableSlots.find(s => s.id.toString() === slotId.toString());
    // console.log("Slot for ID", slotId, "is", slot.id);
    if (!slot) return "Loading...";

    const date = new Date(slot.date);
    return `${date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })} • ${slot.startTime} - ${slot.endTime}`;
  };

  // Safety check to ensure table is initialized and data is available
  if (!tableInstance || !dataState.appointments) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  // Debug logging to help identify the issue
  if (process.env.NODE_ENV === 'development') {
    console.log('AppointmentsPage Debug:', {
      tableInstance: !!tableInstance,
      appointmentsCount: dataState.appointments?.length || 0,
      total: dataState.total,
      columns: tableInstance?.getAllColumns()?.map(col => col.id) || [],
      firstAppointment: dataState.appointments?.[0] || null
    });
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <ToastContainer />
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search appointments..."
            value={(tableInstance?.getColumn("fullName")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              tableInstance?.getColumn("fullName")?.setFilterValue(event.target.value)
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
          {Object.keys(rowSelection).length > 0 && (
            <Button variant="destructive" onClick={deleteSelected}>
              Delete Selected
            </Button>
          )}
        </div>
        <div>
          <Button onClick={() => { setSelectedAppointment(null); reset(); setDialogOpen(true); }}>
            Add Appointment
          </Button>
        </div>
      </div>
      {/* Table */}
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
      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing {pagination.pageIndex * pagination.pageSize + 1}-
          {Math.min((pagination.pageIndex + 1) * pagination.pageSize, dataState.total)} of {dataState.total} appointments
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${pagination.pageSize}`}
              onValueChange={(value) =>
                setPagination((prev) => ({
                  ...prev,
                  pageSize: Number(value),
                  pageIndex: 0,
                }))
              }
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
      {activeCallFrame && (
        <>
          {/* Improved dark overlay that covers the entire viewport */}
          <div
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              margin: 0,
              padding: 0,
              width: '100vw',
              height: '100vh'
            }}
          />

          {/* Close meeting button positioned at bottom center */}
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
            <Button
              variant="destructive"
              size="lg"
              onClick={async () => {
                try {
                  await activeCallFrame.destroy();
                  setActiveCallFrame(null);
                  toast.success("Meeting closed successfully.");
                } catch (error) {
                  console.error("Error closing meeting:", error);
                  toast.error("Failed to close meeting.");
                }
              }}
            >
              Close Meeting
            </Button>
          </div>
        </>
      )}
      {/* Dialog for Create/Edit Appointment */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedAppointment ? "Edit Appointment" : "Create Appointment"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Doctor Dropdown */}
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
            {/* Available Slot Dropdown */}
            <Controller
              control={control}
              name="doctorAvailabilityId"
              rules={{ required: true }}
              render={({ field }) => (
                <Select
                  value={field.value ? field.value.toString() : undefined}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    {availableSlots.length === 0 ? (
                      "Loading slots..."
                    ) : (field.value) ? (
                      availableSlots.find(slot => slot.id.toString() === field.value.toString()) ? (
                        <>
                          <span className="flex items-center gap-2">
                            {formatSlotDisplay(field.value)}
                            <Badge variant="outline" className="border-primary text-primary ml-1">
                              #{field.value}
                            </Badge>
                          </span>

                        </>
                      ) : (
                        "Loading...!"
                      )
                    ) : (
                      "Select Available Slot"
                    )}
                  </SelectTrigger>
                  <SelectContent className="bg-white text-black">
                    {availableSlots?.length > 0 ? (
                      availableSlots.map((slot) => (

                        <SelectItem className="cursor-pointer" disabled={(slot.status === "available") ? false : true} key={slot.id.toString()} value={slot.id.toString()}>
                          <div className="flex justify-between items-center w-full">
                            <Badge variant="outline" className="border-primary text-primary">
                              #{slot.id}
                            </Badge>
                            <span className="mx-2">{formatSlotDisplay(slot.id)}</span>

                            <Badge
                              variant="outline"
                              className={slot.status === "available"
                                ? "border-green-500 text-green-500"
                                : "border-red-500 text-red-500 "
                              }
                            >
                              {slot.status === "available" ? "Available" : "Booked"}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem key="no-slot" value="no-slot" disabled>
                        No available slots
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            <Controller
              control={control}
              name="consultationType"
              rules={{ required: true }}
              render={({ field }) => (
                <Select
                  value={field.value?.toString()}
                  onValueChange={(value) => field.onChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Consultation Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-black">
                    <SelectItem value={ConsultationType.VIDEO}>Video Consultation</SelectItem>
                    <SelectItem value={ConsultationType.PHYSICAL}>Physical Visit</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {/* Status Dropdown */}
            <Controller
              control={control}
              name="status"
              defaultValue="Scheduled"
              rules={{ required: true }}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-black">
                    <SelectItem value={AppointmentStatus.SCHEDULED}>Scheduled</SelectItem>
                    <SelectItem value={AppointmentStatus.COMPLETED}>Completed</SelectItem>
                    <SelectItem value={AppointmentStatus.CANCELLED}>Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {/* Patient Input */}
            <Controller
              control={control}
              name="patientId"
              rules={{ required: true }}
              render={({ field }) => (
                <Select
                  disabled={!!selectedAppointment}
                  onValueChange={field.onChange}
                  value={field.value ? field.value.toString() : undefined}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Patient">
                      {field.value && patients.length > 0 ? (
                        patients.find(p => p.id.toString() === field.value.toString())?.name || "Select Patient"
                      ) : (
                        "Select Patient"
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white text-black">
                    {patients.map((patient) => (
                      <SelectItem key={patient.id.toString()} value={patient.id.toString()}>
                        {patient.name}
                      </SelectItem>
                    ))}
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
                  setSelectedAppointment(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {selectedAppointment ? "Save Changes" : "Create Appointment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}