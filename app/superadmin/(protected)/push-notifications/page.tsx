"use client"

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

type Role = "PATIENT" | "DOCTOR" | "DIETICIAN" | "ADMIN";

type BriefUser = {
  id: number;
  name: string;
  role: Role;
};

export default function PushNotificationsAdminPage() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<BriefUser[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<Role[]>(["PATIENT"]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetch("/api/admin/users/brief");
        const json = await res.json();
        setUsers(json.data || []);
      } catch (e) {
        console.error("Failed to load users", e);
      }
    };
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    if (selectedRoles.length === 0) return users;
    const set = new Set(selectedRoles);
    return users.filter(u => set.has(u.role));
  }, [users, selectedRoles]);

  const toggleRole = (role: Role) => {
    setSelectedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const toggleUser = (userId: number) => {
    setSelectedUserIds(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  const handleSend = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roles: selectedRoles,
          userIds: selectedUserIds,
          title: title || "Notification",
          body: message || "",
        }),
      });
      const json = await res.json();
      setResult(json);
    } catch (e) {
      setResult({ success: false, error: e instanceof Error ? e.message : String(e) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <CardDescription>Send a custom notification to selected roles and users.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <Label className="block text-sm font-medium">Select Roles</Label>
              <div className="space-y-3">
                {["PATIENT","DOCTOR","DIETICIAN"].map((r) => (
                  <div key={r} className="flex items-center gap-2">
                    <Checkbox id={`role-${r}`} checked={selectedRoles.includes(r as Role)} onCheckedChange={() => toggleRole(r as Role)} />
                    <Label htmlFor={`role-${r}`}>{r}</Label>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label className="block text-sm font-medium">Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notification title" />
              </div>

              <div className="space-y-2">
                <Label className="block text-sm font-medium">Message</Label>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your message..." rows={6} />
              </div>

              <Button onClick={handleSend} disabled={loading}>
                {loading ? "Sending..." : "Send Notification"}
              </Button>
            </div>

            <div className="md:col-span-2">
              <Label className="block text-sm font-medium mb-2">Select Users (optional)</Label>
              <div className="border rounded-md max-h-[420px] overflow-auto divide-y">
                {filteredUsers.map(u => (
                  <label key={u.id} className="flex items-center gap-3 p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={selectedUserIds.includes(u.id)}
                      onChange={() => toggleUser(u.id)}
                    />
                    <span className="text-sm">{u.name} <span className="text-xs text-muted-foreground">({u.role})</span></span>
                  </label>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="p-4 text-sm text-muted-foreground">No users found for selected roles.</div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">If you select users, the message will go only to them (intersected with selected roles). If you leave empty, it will send to all users in selected roles.</p>
            </div>
          </div>

          {result && (
            <div className="mt-6 text-sm">
              <pre className="whitespace-pre-wrap break-words bg-muted p-3 rounded-md">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


