"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm, FormProvider } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

const fetchUsers = async () => {
  try {
    const response = await axios.get("/api/admin/users");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return [];
  }
};

const createUser = async (data) => {
  try {
    const response = await axios.post("/api/admin/users", data);
    return response.data;
  } catch (error) {
    console.error("Failed to create user:", error);
    return null;
  }
};

const updateUser = async (id, data) => {
  try {
    const response = await axios.put(`/api/admin/users/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Failed to update user:", error);
    return null;
  }
};

const deleteUser = async (id) => {
  try {
    const response = await axios.delete(`/api/admin/users/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete user:", error);
    return null;
  }
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const methods = useForm();

  const fetchAndSetUsers = async () => {
    const data = await fetchUsers();
    setUsers(data);
  };

  useEffect(() => {
    fetchAndSetUsers();
  }, []);

  const handleCreateUser = async (data) => {
    const result = await createUser(data);
    if (result) {
      fetchAndSetUsers();
      setIsDialogOpen(false);
    }
  };

  const handleUpdateUser = async (data) => {
    const result = await updateUser(selectedUser.id, data);
    if (result) {
      fetchAndSetUsers();
      setSelectedUser(null);
      setIsDialogOpen(false);
    }
  };

  const handleDeleteUser = async (id) => {
    const result = await deleteUser(id);
    if (result) {
      fetchAndSetUsers();
    }
  };

  const handleDialogOpen = (user = null) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setSelectedUser(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Users</h1>
      <Button onClick={() => handleDialogOpen()}>Add User</Button>
      <Table>
        <TableCaption>A list of users.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.id}</TableCell>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Button onClick={() => handleDialogOpen(user)}>Edit</Button>
                <Button onClick={() => handleDeleteUser(user.id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedUser ? "Edit User" : "Add User"}</DialogTitle>
            <DialogDescription>
              {selectedUser ? "Update the user details below." : "Fill in the details to add a new user."}
            </DialogDescription>
          </DialogHeader>
          <FormProvider {...methods}>
            <Form onSubmit={methods.handleSubmit(selectedUser ? handleUpdateUser : handleCreateUser)}>
              <FormField name="name" defaultValue={selectedUser?.name || ""}>
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField name="email" defaultValue={selectedUser?.email || ""}>
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <DialogFooter>
                <Button type="submit">{selectedUser ? "Update" : "Create"}</Button>
                <DialogClose asChild>
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                </DialogClose>
              </DialogFooter>
            </Form>
          </FormProvider>
        </DialogContent>
      </Dialog>
    </div>
  );
}
