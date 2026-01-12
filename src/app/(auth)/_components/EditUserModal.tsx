import React, { useState } from "react";
import toast from "react-hot-toast";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

interface User {
  user_id: string; // Changed from id to user_id to match Supabase
  firstname?: string | null;
  lastname?: string | null;
  role?: string;
  registration_number?: string;
  id?: string;
  // Add other fields as needed
}

export default function EditUserModal({
  user,
  sessionUser,
  onClose,
  onSave,
  roleOptions = [
    { value: "admin", label: "Admin" },
    { value: "club", label: "Club" },
    { value: "student", label: "Student" },
  ],
}: {
  user: User;
  sessionUser: string;
  onClose: () => void;
  onSave: (user: User) => void;
  roleOptions?: SelectOption[];
}) {
  const [formData, setFormData] = useState({
    firstname: user.firstname,
    lastname: user.lastname,
    role: user.role,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleFormChanges = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/users/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          targetUserId: user.user_id,
          ...formData,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Empty or invalid JSON response from server");
      }

      if (res.ok) {
        onSave(data.user);
        toast.success("User updated successfully!");
        onClose();
      } else {
        alert(data.error || "Failed to update user");
        toast.error(`Something went wrong, couldn't update user!`);
      }
    } catch (error) {
      console.error("Request error:", error);
      alert("Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-card border rounded-xl shadow-lg animate-in zoom-in-95 duration-200 flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold tracking-tight kabel-bold">
            Edit User
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="firstname"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              First Name
            </label>
            <Input
              type="text"
              name="firstname"
              id="firstname"
              value={formData.firstname || ""}
              onChange={handleFormChanges}
              placeholder="First Name"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="lastname"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Last Name
            </label>
            <Input
              type="text"
              name="lastname"
              id="lastname"
              value={formData.lastname || ""}
              onChange={handleFormChanges}
              placeholder="Last Name"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="role"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Role
            </label>
            {sessionUser === user.user_id ? (
              <div className="relative">
                <select
                  disabled
                  name="role"
                  id="role"
                  className={cn(
                    "flex h-9 w-full rounded-md border border-input bg-muted px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm opacity-50"
                  )}
                  onChange={handleFormChanges}
                >
                  <option defaultChecked value="change">
                    You can&#39;t change your own role.
                  </option>
                </select>
              </div>
            ) : (
              <select
                name="role"
                id="role"
                value={formData.role || ""}
                onChange={handleFormChanges}
                className={cn(
                  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm hover:cursor-pointer"
                )}
              >
                <option value="" disabled>
                  Please select a new role
                </option>
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="min-w-[80px]"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>Save</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
