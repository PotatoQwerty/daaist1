"use client";

import type { User } from "next-auth";
import { useEffect, useState, useMemo } from "react";
import { ChevronDown, Edit, Loader2Icon } from "lucide-react";
import Link from "next/link";
import EditUserModal from "@/app/(auth)/_components/EditUserModal";
import { RoleGate } from "@/components/RoleGate";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // redirect client-side if unauthenticated
    if (status === "unauthenticated") {
      router.replace("/");
      return;
    }

    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        if (res.ok) {
          setUsers(Array.isArray(data.users) ? data.users : []);
          setFilteredUsers(Array.isArray(data.users) ? data.users : []);
        } else {
          setError(data.error || "Something went wrong");
        }
      } catch (err) {
        setError("Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // memoized sortedUsers so sorting doesn't mutate original array
  const sortedUsers = useMemo(() => {
    const copy = [...users];
    copy.sort((a, b) => {
      const aName = (a.lastname || "").toLowerCase();
      const bName = (b.lastname || "").toLowerCase();
      if (aName < bName) return sortDir === "asc" ? -1 : 1;
      if (aName > bName) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [users, sortDir]);

  // apply search on top of sortedUsers
  useEffect(() => {
    const listToFilter = sortedUsers;
    if (!search.trim()) {
      setFilteredUsers(listToFilter);
      return;
    }
    const lowerSearch = search.toLowerCase();
    setFilteredUsers(
      listToFilter.filter((u) => {
        return (
          (u.firstname || "").toLowerCase().includes(lowerSearch) ||
          (u.lastname || "").toLowerCase().includes(lowerSearch) ||
          (u.registration_number || "").toLowerCase().includes(lowerSearch) ||
          (u.role || "").toLowerCase().includes(lowerSearch)
        );
      })
    );
  }, [search, sortedUsers]);

  const toggleSort = () => setSortDir((d) => (d === "asc" ? "desc" : "asc"));

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
                <th className="px-4 py-2">
                  <div className="flex items-center justify-center gap-2">
                    <span>Last Name</span>
                    <button
                      className="cursor-pointer"
                      onClick={toggleSort}
                      aria-label="Sort by first name"
                    >
                      <ChevronDown className="size-5" />
                    </button>
                  </div>
                </th>
                <th className="px-4 py-2">First Name</th>
                <th className="px-4 py-2">Username</th>
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
                  key={user.id ?? user.registration_number ?? Math.random()}
                  className="border-t hover:bg-accent/50 transition duration-150 ease-in"
                >
                  <td className="px-4 py-2">{user.lastname || "Unknown"}</td>
                  <td className="px-4 py-2">{user.firstname || "Unknown"}</td>
                  <td className="px-4 py-2">
                    {user.username || "Unknown"}{" "}
                    <span className="text-accent font-bold">
                      {user.username === session?.user?.username ? "(Me)" : ""}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {user.registration_number || "Not mentioned"}
                  </td>
                  <td className="px-4 py-2">{user.isDaa ? "Yes" : "No"}</td>
                  <td className="px-4 py-2">{user.studyyear || "—"}</td>
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
                      {user.role || "unknown"}
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
                      type="button"
                      title="Edit user button"
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
                  (u.registration_number ?? u.id) ===
                  (updatedUser.registration_number ?? updatedUser.id)
                    ? updatedUser
                    : u
                )
              );
              setEditingUser(null);
            }}
            user={editingUser}
            sessionUser={session?.user?.id || ""}
          />
        )}
      </div>
    </RoleGate>
  );
}
