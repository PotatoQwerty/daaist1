"use client";

import type { User } from "next-auth";
import { useEffect, useState } from "react";
import { Edit, Loader2Icon } from "lucide-react";
import Link from "next/link";
import EditUserModal from "@/components/EditUserModal";
import { RoleGate } from "@/components/RoleGate";
import { useSession } from "next-auth/react";
import { redirect, RedirectType } from "next/navigation";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");
  const { data: session, status } = useSession();
  useEffect(() => {
    if (!session && status == "unauthenticated")
      return redirect("/", RedirectType.replace);
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        if (res.ok) {
          setUsers(data.users);
          setFilteredUsers(data.users);
        } else {
          setError(data.error || "Something went wrong");
        }
      } catch (error) {
        setError("Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };
    if (status == "authenticated") {
      fetchUsers();
    }
  }, [status, session]);

  useEffect(() => {
    if (!search) {
      setFilteredUsers(users);
    } else {
      const lowerSearch = search.toLowerCase();
      setFilteredUsers(
        users.filter(
          (u) =>
            u.firstname?.toLowerCase().includes(lowerSearch) ||
            u.lastname.toLowerCase().includes(lowerSearch) ||
            u.registration_number?.toLowerCase().includes(lowerSearch) ||
            u.role?.toLowerCase().includes(lowerSearch)
        )
      );
    }
  }, [search, users]);

  if (loading) {
    return (
      <div className="flex w-full h-full gap-2 justify-center items-center text-2xl mt-10">
        <p>Loading Users</p>
        <Loader2Icon className="animate-spin" />
      </div>
    );
  }

  if (error) return <p className="text-red-500 mt-4">{error}</p>;

  return (
    <RoleGate AllowedRoles={["admin"]}>
      <div className="w-screen min-h-screen p-6 bg-background">
        <h1 className="text-2xl font-bold mb-4">All Users</h1>

        {/* Search bar */}
        <div className="mb-4 flex justify-start">
          <input
            type="text"
            placeholder="Search by name, matricule, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border rounded-lg w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div className="overflow-x-auto rounded-lg border border-foreground/20">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-background text-center">
                <th className="px-4 py-2">First Name</th>
                <th className="px-4 py-2">Last Name</th>
                <th className="px-4 py-2">Matricule</th>
                <th className="px-4 py-2">DAA Student</th>
                <th className="px-4 py-2">Study year</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Profile</th>
                <th className="px-4 py-2">Edit</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.registration_number}
                  className="border-t hover:bg-accent/50 transition duration-150 ease-in"
                >
                  <td className="px-4 py-2">{user.firstname}</td>
                  <td className="px-4 py-2">{user.lastname}</td>
                  <td className="px-4 py-2">
                    {user.registration_number || "Not mentioned"}
                  </td>
                  <td className="px-4 py-2">{user.isDaa ? "Yes" : "No"}</td>
                  <td className="px-4 py-2">{user.studyyear}</td>
                  <td className="px-4 py-2 text-center">
                    <span
                      className={`px-2 py-1 rounded-full font-bold text-xs ${
                        user.role === "student"
                          ? "bg-blue-500 text-white"
                          : user.role === "admin"
                          ? "bg-red-500 text-white"
                          : "bg-yellow-500 text-black"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/profile/${user.username}`}
                      className="underline hover:text-accent"
                    >
                      View profile
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      className="flex items-center justify-center w-full text-gray-500 hover:text-accent transition"
                      onClick={() => setEditingUser(user)}
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
    </RoleGate>
  );
}
