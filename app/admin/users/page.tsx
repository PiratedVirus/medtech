"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

// Add these to your API routes
// /api/clinics:
/*
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const clinics = await prisma.clinic.findMany();
    return NextResponse.json(clinics);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch clinics" }, { status: 500 });
  }
}
*/

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { register, handleSubmit, reset, setValue } = useForm();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, clinicsRes] = await Promise.all([
          axios.get("/api/admin/users"),
          axios.get("/api/admin/clinics")
        ]);
        setUsers(usersRes.data);
        setClinics(clinicsRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      setValue("name", selectedUser.name);
      setValue("phoneNumber", selectedUser.phoneNumber);
      setValue("email", selectedUser.email);
      setValue("role", selectedUser.role);
      setValue("clinicId", selectedUser.clinicId);
      setValue("status", selectedUser.status);
    } else {
      reset();
    }
  }, [selectedUser, setValue, reset]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        clinicId: data.clinicId ? Number(data.clinicId) : null,
        status: data.status || "ACTIVE",
      };
  
      if (selectedUser) {
        // Send ID in request body for PUT
        await axios.put("/api/admin/users", { 
          id: selectedUser.id,
          ...payload
        });
      } else {
        await axios.post("/api/admin/users", payload);
      }
  
      setDialogOpen(false);
      const response = await axios.get("/api/admin/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  const deleteUser = async (id) => {
    try {
      // Send ID in request body for DELETE
      await axios.delete("/api/admin/users", { 
        data: { id } 
      });
      setUsers(users.filter(user => user.id !== id));
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Users</h1>
        <Button className="bg-slate-800 text-white" onClick={() => {
          setSelectedUser(null);
          setDialogOpen(true);
        }}>Add User</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>{user.status}</TableCell>
              <TableCell>{user.phoneNumber}</TableCell>
              <TableCell className="space-x-2">
                <Button className="bg-slate-800 text-white" size="sm" onClick={() => {
                  setSelectedUser(user);
                  setDialogOpen(true);
                }}>
                  Edit
                </Button>
                <Button
                 
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteUser(user.id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? "Edit User" : "Create New User"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              {...register("name", { required: true })}
              placeholder="Full Name"
            />
            
            <Input
              {...register("phoneNumber", { required: true })}
              placeholder="Phone Number"
            />
            
            <Input
              {...register("email")}
              type="email"
              placeholder="Email"
            />
            
            <Input
              {...register("password")}
              type="password"
              placeholder="Password"
            />

            <Select 
              onValueChange={(value) => setValue("role", value)}
              defaultValue={selectedUser?.role}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PATIENT">Patient</SelectItem>
                <SelectItem value="DOCTOR">Doctor</SelectItem>
                <SelectItem value="LAB_TECH">Lab Technician</SelectItem>
                <SelectItem value="DIETICIAN">Dietician</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>

            <Select
              onValueChange={(value) => setValue("status", value)}
              defaultValue={selectedUser?.status || "ACTIVE"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <Select
              onValueChange={(value) => setValue("clinicId", value)}
              defaultValue={selectedUser?.clinicId?.toString()}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Clinic" />
              </SelectTrigger>
              <SelectContent>
                {clinics.map((clinic) => (
                  <SelectItem key={clinic.id} value={clinic.id.toString()}>
                    {clinic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button className="bg-slate-800 text-white" type="submit">
                {selectedUser ? "Save Changes" : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}