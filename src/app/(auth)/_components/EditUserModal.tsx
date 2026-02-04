import React, { useState } from "react";
import toast from "react-hot-toast";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Select from "react-select";

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
  user_roles?: { role: string }[]; // Array of role objects from Supabase
  // Add other fields as needed
}

export default function EditUserModal({
  user,
  sessionUser,
  onClose,
  onSave,
  roleOptions = [
    { value: "super_admin", label: "Super Admin" },
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
  // Helper to convert role string(s) or user_roles array to SelectOption array
  const getRoleValue = (): SelectOption[] => {
    // First check user_roles array (from ManageUsers)
    if (user.user_roles && user.user_roles.length > 0) {
      return user.user_roles
        .map((r) => roleOptions.find((opt) => opt.value === r.role))
        .filter(
          (opt): opt is SelectOption => opt !== undefined && opt.value !== ""
        );
    }
    // Fallback to role string
    if (!user.role) return [];
    const roles = user.role.split(",").map((r) => r.trim());
    return roles
      .map((r) => roleOptions.find((opt) => opt.value === r))
      .filter(
        (opt): opt is SelectOption => opt !== undefined && opt.value !== ""
      );
  };

  const [formData, setFormData] = useState({
    firstname: user.firstname,
    lastname: user.lastname,
    role: user.role,
  });
  const [selectedRoles, setSelectedRoles] = useState<SelectOption[]>(
    getRoleValue()
  );
  const [isSaving, setIsSaving] = useState(false);
  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: "var(--background)",
      borderColor: state.isFocused ? "var(--ring)" : "var(--border)",
      boxShadow: state.isFocused ? "0 0 0 1px var(--ring)" : "none",
      borderRadius: "0.75rem",
      minHeight: "44px",
      padding: "2px 4px",
      opacity: state.isDisabled ? 0.6 : 1,
      ":hover": {
        borderColor: "var(--ring)",
      },
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: "var(--background)",
      border: "1px solid var(--border)",
      borderRadius: "0.75rem",
      zIndex: 20,
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? "var(--accent)" : "transparent",
      color: state.isFocused ? "var(--accent-foreground)" : "var(--foreground)",
      cursor: "pointer",
    }),
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: "var(--muted)",
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: "var(--foreground)",
    }),
    multiValueRemove: (base: any) => ({
      ...base,
      color: "var(--muted-foreground)",
      ":hover": {
        backgroundColor: "var(--destructive)",
        color: "white",
      },
    }),
    singleValue: (base: any) => ({
      ...base,
      color: "var(--foreground)",
    }),
    placeholder: (base: any) => ({
      ...base,
      color: "var(--muted-foreground)",
    }),
    input: (base: any) => ({
      ...base,
      color: "var(--foreground)",
    }),
  };

  const handleFormChanges = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (selected: readonly SelectOption[] | null) => {
    const selectedArray = selected ? [...selected] : [];
    setSelectedRoles(selectedArray);
    // Store as comma-separated string
    const roleString = selectedArray.map((opt) => opt.value).join(",");
    setFormData({ ...formData, role: roleString });
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
          firstname: formData.firstname,
          lastname: formData.lastname,
          // Send roles as an array for the API to handle properly
          roles: selectedRoles.map((opt) => opt.value),
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
                <Select
                  isMulti
                  isDisabled
                  options={roleOptions}
                  value={getRoleValue()}
                  classNamePrefix="react-select"
                  styles={selectStyles}
                />
              </div>
            ) : (
              <Select
                isMulti
                options={roleOptions}
                value={selectedRoles}
                onChange={handleRoleChange}
                placeholder="Select roles..."
                classNamePrefix="react-select"
                styles={selectStyles}
              />
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              isSaving ||
              (selectedRoles.length === 0 && sessionUser !== user.user_id)
            }
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
