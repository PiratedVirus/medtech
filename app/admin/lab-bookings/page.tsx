"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { put } from "@vercel/blob";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";

interface LabBooking {
  id: number;
  labDate: string;
  status: string;
  labResult: string[];
  patient: { name: string };
  labPackage: { name: string };
}

const statusOptions = [
  "pending",
  "confirmed",
  "assigned to lab admin",
  "sample collected",
  "result generated",
  "completed",
];

const fetchLabBookings = async (pageIndex: number, pageSize: number) => {
  const res = await axios.get(
    `/api/admin/dashboard/lab-bookings?page=${pageIndex + 1}&pageSize=${pageSize}`
  );
  return res.data as { data: LabBooking[]; total: number };
};

const updateStatus = async (id: number, status: string) => {
  await axios.put(`/api/admin/dashboard/lab-bookings`, { id, status });
};

export default function AdminLabBookingsPage() {
  const [data, setData] = useState<{ bookings: LabBooking[]; total: number }>({
    bookings: [],
    total: 0,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [uploadingBookingId, setUploadingBookingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const columns: ColumnDef<LabBooking>[] = [
    {
      accessorFn: (row) => row.patient?.name,
      id: "patient.name",
      header: "Patient",
    },
    {
      accessorFn: (row) => row.labPackage?.name,
      id: "labPackage.name",
      header: "Package",
    },
    {
      accessorKey: "labDate",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Date</Button>
      ),
      cell: ({ row }) => new Date(row.getValue("labDate")).toLocaleDateString(),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Select
          value={row.original.status}
          onValueChange={async (value) => {
            await updateStatus(row.original.id, value);
            await fetchData();
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={row.original.status} />
          </SelectTrigger>
          <SelectContent className="bg-white text-black">
            {statusOptions.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      id: "reports",
      header: "Reports",
      cell: ({ row }) => (
        <div>
          {row.original.labResult && row.original.labResult.length > 0 ? (
            row.original.labResult.map((url, idx) => (
              <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="m-1">
                  View {idx + 1}
                </Button>
              </a>
            ))
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => setUploadingBookingId(row.original.id)}>
                  Upload
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>Upload Lab Report PDF</DialogTitle>
                <UploadDropZone />
                {uploading && <p>Uploading...</p>}
                {uploadSuccess && (
                  <p className="text-green-600 text-sm text-center mt-2">Upload successful!</p>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: data.bookings,
    columns,
    pageCount: Math.ceil(data.total / pagination.pageSize),
    state: { sorting, pagination },
    manualPagination: true,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  async function fetchData() {
    const result = await fetchLabBookings(pagination.pageIndex, pagination.pageSize);
    setData({ bookings: result.data, total: result.total });
  }

  useEffect(() => {
    fetchData();
  }, [pagination.pageIndex, pagination.pageSize, sorting]);

  const handleMultipleFilesUpload = async (files: FileList, id: number) => {
    if (!files || !id) return;
    setUploading(true);
    try {
      const uploadedLinks: string[] = [];
      for (const file of Array.from(files)) {
        const arrayBuffer = await file.arrayBuffer();
        const fileName = `lab-${id}-${file.name}`;
        const { url } = await put(fileName, arrayBuffer, {
          access: "public",
          token: process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN,
        });
        uploadedLinks.push(url);
      }

      await axios.put(`/api/admin/dashboard/patients-details`, {
        labBookingId: id,
        links: uploadedLinks,
      });

      await fetchData();
      setUploadSuccess(true);
      toast.success("Lab reports uploaded successfully.");
      setTimeout(() => {
        setUploadingBookingId(null);
        setUploadSuccess(false);
      }, 1500);
    } catch (err) {
      console.error("Upload failed", err);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const UploadDropZone = () => (
    <div
      className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition"
      onDrop={async (e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files && uploadingBookingId) {
          await handleMultipleFilesUpload(files, uploadingBookingId);
        }
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="flex flex-col items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 16v-4m0 0l-2 2m2-2l2 2m6 4H6a2 2 0 01-2-2V7a2 2 0 012-2h3.586a1 1 0 01.707.293l1.414 1.414A1 1 0 0012 7h8a2 2 0 012 2v7a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-sm text-gray-600">Drag & drop PDF here or click below</p>
        <label className="cursor-pointer bg-muted px-3 py-1 text-sm rounded border border-gray-300 mt-2 hover:bg-primary hover:text-white transition">
          Browse files
          <input
            type="file"
            accept="application/pdf"
            multiple
            hidden
            onChange={async (e) => {
              if (uploadingBookingId && e.target.files) {
                await handleMultipleFilesUpload(e.target.files, uploadingBookingId);
              }
            }}
          />
        </label>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-4 space-y-4 bg-white">
      <ToastContainer />
      <h2 className="text-2xl font-bold">Lab Bookings</h2>
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
                <TableRow key={row.id} className="text-center">
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
          {Math.min((pagination.pageIndex + 1) * pagination.pageSize, data.total)} of {data.total} bookings
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
      <Card className="rounded-lg p-4 bg-custom-mutedgreen">
        <h3 className="font-semibold text-xl mb-4">Lab Results</h3>
        <div className="flex flex-wrap gap-4">
          {data.bookings.map((booking) => (
            <Card
              key={booking.id}
              className="group relative overflow-hidden border border-gray-100 bg-stone-50 shadow-sm transition-all duration-300 rounded-lg p-4 w-36 h-48 flex flex-col items-center text-center"
            >
              <h4 className="font-medium mb-2">
                <b>{booking.labPackage?.name}</b>
              </h4>
              <p className="text-sm mb-4">
                Booked on {new Date(booking.labDate).toLocaleDateString()}
              </p>
              <div className="mt-auto flex items-center justify-between">
                {Array.isArray(booking.labResult) && booking.labResult.length > 0 ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        View Reports
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogTitle>Lab Reports</DialogTitle>
                      <div className="flex flex-wrap gap-2">
                        {booking.labResult.map((url, index) => (
                          <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="whitespace-nowrap">
                              {decodeURIComponent(url.split("/").pop() || `LabReport-${index + 1}`)}
                            </Button>
                          </a>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" onClick={() => setUploadingBookingId(booking.id)}>
                        Upload Report
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogTitle>Upload Lab Report PDF</DialogTitle>
                      <UploadDropZone />
                      {uploading && <p>Uploading...</p>}
                      {uploadSuccess && (
                        <p className="text-green-600 text-sm text-center mt-2">Upload successful!</p>
                      )}
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
