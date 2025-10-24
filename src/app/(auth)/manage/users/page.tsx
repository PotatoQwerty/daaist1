"use client";
import type { User } from "next-auth";
import { useEffect, useState } from "react";
import { Edit } from "lucide-react";
import EditUserModal from "@/components/EditUserModal";
export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (res.ok) setUsers(data.users);
      else setError(data.error);
    };
    fetchUsers();
  }, []);

  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">All Users</h1>

      <table className="min-w-full text-sm border border-foreground">
        <thead>
          <tr className="bg-background text-center">
            <th className="px-4 py-2">First Name</th>
            <th className="px-4 py-2">Last Name</th>
            <th className="px-4 py-2">Matricule</th>
            <th className="px-4 py-2">DAA student</th>
            <th className="px-4 py-2">Role</th>
            <th className="px-4 py-2">Edit</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.registration_number} className="border-t">
              <td className="px-4 py-2">{user.firstname}</td>
              <td className="px-4 py-2">{user.lastname}</td>
              <td className="p-2">
                {user.registration_number || "Not mentioned"}
              </td>
              <td className="px-4 py-2">{user.isDaa ? "Yes" : "no"}</td>
              <td
                className={`px-4 py-2 font-bold text-white text-center
    ${
      user.role === "student"
        ? "bg-primary"
        : user.role === "admin"
        ? "bg-accent"
        : "bg-secondary"
    }`}
              >
                {user.role}
              </td>
              <td>
                <button
                  className="flex items-center justify-center w-full hover:text-accent transition-colors ease-in-out duration-300"
                  onClick={() => setEditingUser(user)}
                >
                  <Edit className="size-fit" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {editingUser && (
        <EditUserModal
          onClose={() => setEditingUser(null)}
          onSave={(updatedUser) => {
            setUsers((prev) =>
              prev.map((u) =>
                u.registration_number === updatedUser.registration_number
                  ? updatedUser
                  : u
              )
            );
            setEditingUser(null);
          }}
          user={editingUser}
        />
      )}
    </div>
  );
}
