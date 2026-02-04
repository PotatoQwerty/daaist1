"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Edit, Search, User2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EditUserModal from "./EditUserModal";
import EmptyState from "@/components/EmptyState";

type UserRole = { role: string };

interface ExtendedUser {
  user_id: string;
  firstname?: string | null;
  lastname?: string | null;
  username?: string | null;
  email?: string | null;
  image?: string | null;
  student_enrollments?: {
    registration_number?: string;
    isdaa?: boolean;
    study_year?: string;
  } | null;
  user_roles?: UserRole[] | null;
  registration_number?: string | null;
}

interface ManageUsersProps {
  initialUsers: any[];
  currentUserId: string;
}

function roleBadgeClassName(role: string) {
  switch (role) {
    case "student":
      return "bg-primary/10 text-primary border-primary/20";
    case "admin":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "super_admin":
      return "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
    case "club":
      return "bg-accent/10 text-accent border-accent/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export default function ManageUsers({
  initialUsers,
  currentUserId,
}: ManageUsersProps) {
  const [users, setUsers] = useState<ExtendedUser[]>(
    (initialUsers ?? []) as ExtendedUser[]
  );
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
  }, [sortDir, users]);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return sortedUsers;
    const lowerSearch = search.toLowerCase();
    return sortedUsers.filter((u) => {
      const roles = (u.user_roles ?? []).map((r) => r.role).join(" ");
      return (
        (u.firstname || "").toLowerCase().includes(lowerSearch) ||
        (u.lastname || "").toLowerCase().includes(lowerSearch) ||
        (u.username || "").toLowerCase().includes(lowerSearch) ||
        String(u.registration_number ?? "")
          .toLowerCase()
          .includes(lowerSearch) ||
        roles.toLowerCase().includes(lowerSearch)
      );
    });
  }, [search, sortedUsers]);

  const toggleSort = () => setSortDir((d) => (d === "asc" ? "desc" : "asc"));

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-background to-secondary/10" />
        <div className="absolute -top-24 right-10 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-10">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Admin
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Manage users
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Search users, review enrollment info, and update roles.
          </p>
        </header>

        <section className="rounded-3xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/70">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-[380px]">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, username, matricule, role…"
                  className="pl-9"
                />
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs text-muted-foreground">
                <span className="inline-block size-2 rounded-full bg-primary/60" />
                DAA student
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {filteredUsers.length} user
              {filteredUsers.length === 1 ? "" : "s"}
            </p>
          </div>
        </section>

        <section className="overflow-auto rounded-3xl border border-border/60 bg-card/80 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/70">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="sticky top-0 z-10 border-b border-border bg-muted/50 backdrop-blur supports-backdrop-filter:bg-muted/40">
              <tr className="text-left">
                <th className="p-3 font-semibold">
                  <button
                    type="button"
                    onClick={toggleSort}
                    className="inline-flex items-center gap-2 hover:text-foreground"
                    aria-label="Sort by last name"
                  >
                    Last name
                    <ChevronDown
                      className={cn(
                        "size-4 transition-transform",
                        sortDir === "asc" ? "rotate-0" : "rotate-180"
                      )}
                    />
                  </button>
                </th>
                <th className="p-3 font-semibold">First name</th>
                <th className="p-3 font-semibold">Username</th>
                <th className="p-3 font-semibold">Matricule</th>
                <th className="p-3 font-semibold">DAA</th>
                <th className="p-3 font-semibold">Year</th>
                <th className="p-3 font-semibold">Roles</th>
                <th className="p-3 font-semibold">Profile</th>
                <th className="p-3 font-semibold text-right">Edit</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6">
                    <EmptyState
                      icon={User2}
                      title="No users found"
                      description="Try adjusting your search keywords."
                    />
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isDaa = Boolean(user.student_enrollments?.isdaa);
                  const isMe = user.user_id === currentUserId;
                  const username = user.username ? `@${user.username}` : "—";

                  return (
                    <tr
                      key={user.user_id}
                      className={cn(
                        "border-b border-border/60 last:border-0 transition-colors",
                        isDaa
                          ? "bg-primary/5 hover:bg-primary/10"
                          : "hover:bg-muted/30"
                      )}
                    >
                      <td className="p-3 font-medium">
                        {user.lastname || "—"}
                      </td>
                      <td className="p-3">{user.firstname || "—"}</td>
                      <td className="p-3">
                        <span className="font-medium text-foreground">
                          {username}
                        </span>
                        {isMe && (
                          <span className="ml-2 inline-flex items-center rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Me
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="text-muted-foreground">
                          {user.registration_number || "—"}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
                            isDaa
                              ? "border-primary/20 bg-primary/10 text-primary"
                              : "border-border bg-muted/30 text-muted-foreground"
                          )}
                        >
                          {isDaa ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {user.student_enrollments?.study_year || "—"}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          {(user.user_roles ?? []).length > 0 ? (
                            (user.user_roles ?? []).map((role) => (
                              <span
                                key={`${user.user_id}-${role.role}`}
                                className={cn(
                                  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
                                  roleBadgeClassName(role.role)
                                )}
                              >
                                {role.role}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        {user.username ? (
                          <Button
                            asChild
                            variant="link"
                            className="h-auto p-0 text-sm"
                          >
                            <Link href={`/profile/${user.username}`}>
                              View profile
                            </Link>
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setEditingUser(user)}
                          title="Edit user"
                        >
                          <Edit className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>
      </div>

      {editingUser && (
        <EditUserModal
          roleOptions={[
            { value: "super_admin", label: "Super Admin" },
            { value: "admin", label: "Admin" },
            { value: "club", label: "Club" },
            { value: "student", label: "Student" },
          ]}
          onClose={() => setEditingUser(null)}
          onSave={(updatedUser) => {
            setUsers((prev) =>
              prev.map((u) =>
                u.user_id === updatedUser.user_id
                  ? {
                      ...u,
                      ...updatedUser,
                      user_roles: updatedUser.user_roles ?? u.user_roles,
                    }
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
  );
}
