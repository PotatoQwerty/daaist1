import React, { useState } from "react";

export default function EditUserModal({
  user,
  onClose,
  onSave,
}: {
  user: object;
  onClose: () => void;
  onSave: (user: object) => void;
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
      const res = await fetch(`/api/users/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registration_number: user.registration_number,
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
      alert("Something went wrong: " + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50 p-4">
      <div className="p-6 rounded-lg w-[440px] shadow-lg">
        <h2 className="text-xl font-bold">Edit User:</h2>

        <label htmlFor="firstname">First Name</label>
        <input
          className="w-full p-2 rounded-md border-foreground border"
          type="text"
          name="firstname"
          id="firstname"
          value={formData.firstname}
          onChange={handleFormChanges}
        />

        <label htmlFor="lastname">Last Name</label>
        <input
          className="w-full p-2 rounded-md border-foreground border"
          type="text"
          name="lastname"
          id="lastname"
          value={formData.lastname}
          onChange={handleFormChanges}
        />

        <label htmlFor="role">Role</label>
        <select
          name="role"
          id="role"
          className="w-full p-2 rounded-md border-foreground border"
          onChange={handleFormChanges}
        >
          <option value="admin">Admin</option>
          <option value="club">Club</option>
          <option value="student">Student</option>
        </select>

        <div className="flex justify-end gap-2 p-4">
          <button className="bg-green-500 rounded-lg p-2" onClick={handleSave}>
            Save
          </button>
          <button
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
