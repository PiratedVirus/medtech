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
import { ChevronDown, ArrowUpDown, EditIcon, Trash, EyeIcon } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ViewParametersDialog from "@/components/common/ViewParametersDialog";

interface Lab {
  id: number;
  name: string;
  description?: string;
  shortDescription?: string;
  price: number;
  parameters?: string;
  criticalRequirements?: string;
  isLabPackage?: boolean;
}

interface FetchLabsResponse {
  data: Lab[];
  total: number;
}

const fetchLabs = async (pageIndex: number, pageSize: number): Promise<FetchLabsResponse> => {
  try {
    const response = await axios.get(`/api/admin/labs?page=${pageIndex + 1}&pageSize=${pageSize}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch labs:", error);
    return { data: [], total: 0 };
  }
};

interface CreateLabData {
  name: string;
  description?: string;
  shortDescription?: string;
  price: number;
  parameters?: string;
  criticalRequirements?: string;
  isLabPackage?: boolean;
}

const createLab = async (data: CreateLabData): Promise<Lab | null> => {
  try {
    const response = await axios.post("/api/admin/labs", data);
    return response.data;
  } catch (error) {
    console.error("Failed to create lab:", error);
    return null;
  }
};

interface UpdateLabData {
  name: string;
  description?: string;
  shortDescription?: string;
  price: number;
  parameters?: string;
  criticalRequirements?: string;
  isLabPackage?: boolean;
}

const updateLab = async (id: number, data: UpdateLabData): Promise<Lab | null> => {
  try {
    const dataWithId = { ...data, id };
    const response = await axios.put(`/api/admin/labs`, dataWithId);
    return response.data;
  } catch (error) {
    console.error("Failed to update lab:", error);
    return null;
  }
};

interface DeleteLabResponse {
  success: boolean;
}

const deleteLab = async (id: number): Promise<DeleteLabResponse | null> => {
  try {
    const response = await axios.delete(`/api/admin/labs/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete lab:", error);
    return null;
  }
};

export default function LabsPage() {
  const [data, setData] = useState<{ labs: Lab[]; total: number }>({ labs: [], total: 0 });
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewParametersOpen, setViewParametersOpen] = useState(false);
  const { register, handleSubmit, reset, setValue } = useForm<FormData>();
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: true }]);
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
      accessorKey: "name",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "shortDescription",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Short Description <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "description",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Description <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Price <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "criticalRequirements",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Critical Requirements <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => row.original.criticalRequirements || "-",
      enableSorting: true,
    },
    {
      id: "parameters",
      header: "Parameters",
      cell: ({ row }) => {
        const params: string[] = row.original.parameters
        ? row.original.parameters.split(",").map((p: string) => p.trim())
        : [];
        return (
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-gray-700">{params.length} parameters</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedLab(row.original);
                setViewParametersOpen(true);
              }}
            >
              <EyeIcon className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="space-x-2">
          <Button
            size="sm"
            className="bg-transparent text-primary border-0 shadow-none"
            onClick={() => {
              setSelectedLab(row.original);
              setValue("name", row.original.name);
              setValue("description", row.original.description);
              setValue("price", row.original.price);
              setValue("parameters", row.original.parameters);
              setValue("criticalRequirements", row.original.criticalRequirements);
              setDialogOpen(true);
            }}
          >
            <EditIcon className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="destructive" onClick={() => deleteLab(row.original.id)}>
            <Trash className="h-4 w-4" />
          </Button>

        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: data.labs,
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
    const { data, total } = await fetchLabs(pagination.pageIndex, pagination.pageSize);
    setData({ labs: data, total });
  };

  useEffect(() => {
    fetchData();
  }, [pagination.pageIndex, pagination.pageSize, sorting]);

  useEffect(() => {
    if (selectedLab) {
      setValue("name", selectedLab.name);
      setValue("description", selectedLab.description);
      setValue("price", selectedLab.price);
      setValue("parameters", selectedLab.parameters);
      setValue("criticalRequirements", selectedLab.criticalRequirements);
      setValue("isLabPackage", selectedLab.isLabPackage ?? false);
    } else {
      reset();
    }
  }, [selectedLab, setValue, reset]);

  interface FormData {
    name: string;
    description?: string;
    shortDescription?: string;
    price: number;
    parameters?: string;
    criticalRequirements?: string;
    isLabPackage?: boolean;
  }

  const onSubmit = async (formData: FormData) => {
    try {
      formData.price = Number(formData.price);

      if (formData.parameters) {
        formData.parameters = formData.parameters
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean)
          .join(", ");
      }

      // Ensure isLabPackage is always boolean
      if (!formData.isLabPackage) {
        formData.isLabPackage = false;
      }

      if (selectedLab) {
        await updateLab(selectedLab.id, formData);
        toast.success("Lab updated successfully");
      } else {
        await createLab(formData);
        toast.success("Lab created successfully");
      }
      await fetchData();
      setDialogOpen(false);
      reset();
      setSelectedLab(null);
    } catch (error) {
      console.error("Error saving lab:", error);
      toast.error("Failed to save lab");
    }
  };

  const deleteSelected = async () => {
    const selectedIds = Object.keys(rowSelection).map(
      (index) => data.labs[parseInt(index)].id
    );
    try {
      await axios.delete("/api/admin/labs", { data: { ids: selectedIds } });
      toast.success("Selected labs deleted successfully");
      await fetchData();
      setRowSelection({});
    } catch (error) {
      console.error("Error deleting labs:", error);
      toast.error("Failed to delete selected labs");
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <ToastContainer />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search labs..."
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
        <div>
          <Button onClick={() => setDialogOpen(true)}>Add Lab</Button>
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
          {Math.min((pagination.pageIndex + 1) * pagination.pageSize, data.total)} of {data.total} labs
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
            <DialogTitle>{selectedLab ? "Edit Lab" : "Create New Lab"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input {...register("name", { required: true })} placeholder="Name" />
            <Input {...register("shortDescription")} placeholder="Short Description" />
            <Input {...register("description")} placeholder="Description" />
            <Input type="number" {...register("price", { required: true })} placeholder="Price" />
            <Input {...register("parameters")} placeholder="Parameters (comma-separated)" />
            <Input {...register("criticalRequirements")} placeholder="Critical Requirements" />
            <label className="flex items-center space-x-2">
              <input type="checkbox" {...register("isLabPackage")} />
              <span>Is it a Lab Package Test?</span>
            </label>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setSelectedLab(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">{selectedLab ? "Save Changes" : "Create Lab"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ViewParametersDialog
        open={viewParametersOpen}
        onOpenChange={setViewParametersOpen}
        // @ts-ignore
        parameters={
          selectedLab?.parameters
            ? selectedLab.parameters.split(",").map((p) => p.trim())
            : []
        }
      />
    </div>
  );
}
