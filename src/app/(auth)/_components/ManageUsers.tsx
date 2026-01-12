"use client";

// "use client"; // Already at top

import { useMemo, useEffect, useState } from "react";
import Link from "next/link";
import EditUserModal from "./EditUserModal";
import { ChevronDown, Edit } from "lucide-react";

// Removed next-auth imports

interface ExtendedUser {
  id?: string;
  user_id: string;
  firstname?: string | null;
  lastname?: string | null;
  username?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
  student_enrollments?: {
    registration_number?: string;
    isdaa?: boolean;
    study_year?: string;
  };
  user_roles?: {
    role: string;
  }[];
  registration_number?: string;
}

interface ManageUsersInterface {
  initialUsers: any[]; // relaxed type for initial input
  currentUserId: string;
}
function ManageUsers({ initialUsers, currentUserId }: ManageUsersInterface) {
  // const { data: session } = useSession(); // Removed

  const [users, setUsers] = useState<ExtendedUser[]>(initialUsers || []);
  const [filteredUsers, setFilteredUsers] = useState<ExtendedUser[]>([]);
  const [editingUser, setEditingUser] = useState<ExtendedUser | null>(null);
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
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
          (u.role || u.user_roles?.[0]?.role || "")
            .toLowerCase()
            .includes(lowerSearch)
        );
      })
    );
  }, [search, sortedUsers]);

  const toggleSort = () => setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  return (
    <>
      <div className="w-screen min-h-screen p-6 bg-background">
        <h1 className="text-2xl font-bold mb-4">All Users</h1>
        <div className="bg-white/20 w-fit p-2 rounded-lg m-1">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            Users colored with
            <span className="size-4 rounded-full bg-primary/20 inline-block" />
            study in Daa
          </span>
        </div>

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
                      type="button"
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
                  className={`border-t transition duration-150 ease-in ${
                    user.student_enrollments?.isdaa
                      ? "bg-primary/20 hover:bg-primary/30"
                      : "hover:bg-accent/30"
                  }`}
                >
                  <td className="px-4 py-2">{user.lastname || "Unknown"}</td>
                  <td className="px-4 py-2">{user.firstname || "Unknown"}</td>
                  <td className="px-4 py-2">
                    {user.username || "Unknown"}{" "}
                    <span className="text-accent font-bold">
                      {user.user_id === currentUserId ? "(Me)" : ""}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {user.registration_number || "Not mentioned"}
                  </td>
                  <td className="px-4 py-2">
                    {user.student_enrollments?.isdaa ? "Yes" : "No"}
                  </td>
                  <td className="px-4 py-2">
                    {user.student_enrollments?.study_year || "—"}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span
                      className={`px-2 py-1 rounded-full font-bold text-xs ${
                        user.user_roles?.[0]?.role === "student"
                          ? "bg-blue-500 text-white"
                          : user.user_roles?.[0]?.role === "admin"
                          ? "bg-red-500 text-white"
                          : "bg-yellow-500 text-black"
                      }`}
                    >
                      {user.user_roles &&
                        (user.user_roles.length > 1
                          ? user.user_roles.map((role) => role.role).join(" & ")
                          : user.user_roles[0]?.role)}
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
            roleOptions={[
              { value: "admin", label: "Admin" },
              { value: "club", label: "Club" },
              { value: "student", label: "Student" },
            ]}
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
            sessionUser={currentUserId}
          />
        )}
      </div>
    </>
  );
}

export default ManageUsers;
