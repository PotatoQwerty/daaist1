import React, { useState } from "react";
import type { User } from "next-auth";

interface SelectOption {
  value: string;
  label: string;
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

  const handleFormChanges = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
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
      } else {
        alert(data.error || "Failed to update user");
      }
    } catch (error) {
      console.error("Request error:", error);
      alert("Something went wrong: ");
    }
  };

  return (
    <div className="fixed inset-0  bg-background/80 flex items-center justify-center z-50 p-4 text-black">
      <div className="p-6 rounded-lg w-[440px] shadow-lg  bg-white">
        <h2 className="text-xl font-bold">Edit User:</h2>

        <label htmlFor="firstname">First Name</label>
        <input
          className="w-full p-2 rounded-md border-foreground border "
          type="text"
          name="firstname"
          id="firstname"
          value={formData.firstname || ""}
          onChange={handleFormChanges}
        />

        <label htmlFor="lastname">Last Name</label>
        <input
          className="w-full p-2 rounded-md border-foreground border"
          type="text"
          name="lastname"
          id="lastname"
          value={formData.lastname || ""}
          onChange={handleFormChanges}
        />
        {sessionUser === user.id ? (
          <>
            <label htmlFor="role">Role</label>
            <select
              disabled
              name="role"
              id="role"
              className="w-full p-2 rounded-md border-foreground border disabled:bg-accent/20"
              onChange={handleFormChanges}
            >
              <option defaultChecked value="change">
                You can&#39;t change your own role.
              </option>
            </select>
          </>
        ) : (
          <>
            <label htmlFor="role">Role</label>
            <select
              name="role"
              id="role"
              className="w-full p-2 rounded-md border-foreground border"
              onChange={handleFormChanges}
            >
              <option value="">Please select a new role</option>
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </>
        )}

        <div className="flex justify-end gap-2 p-4">
          <button
            type="button"
            className="bg-green-500 rounded-lg p-2"
            onClick={handleSave}
          >
            Save
          </button>
          <button
            type="button"
            className="bg-accent rounded-lg p-2 hover:bg-accent/70"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
