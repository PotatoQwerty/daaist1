"use client";

import { useEffect, useState } from "react";
import EditUserModal from "./EditUserModal";
import { useSession } from "next-auth/react";
import { notFound } from "next/navigation";

const roleOptions = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "club", label: "Club" },
  { value: "student", label: "Student" },
];
function ManageInvites() {
  const { data: session } = useSession();
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    const fetchInvites = async () => {
      const res = await fetch("/api/admin/invite/manage");
      const data = await res.json();

      setPendingInvites(data.pendingAdmins);
    };

    fetchInvites();
  }, []);
  if (!session) return notFound();
  return (
    <div>
      <h1>Manage existing invites</h1>

      {pendingInvites?.length ? (
        <>
          {pendingInvites.map((user) => (
            <div className="flex gap-1" key={user.id}>
              <p className="p-1 border rounded-lg max-w-3xs bg-muted">
                {user.firstname}
              </p>
              <p className="p-1 border rounded-lg max-w-3xs bg-muted">
                {user.lastname}
              </p>
              <button
                type="button"
                className="p-1 bg-accent rounded-lg"
                onClick={() => {
                  setEditingUser(user);
                }}
              >
                Check this invite
              </button>
            </div>
          ))}
          {editingUser && (
            <EditUserModal
              roleOptions={roleOptions}
              user={editingUser}
              sessionUser={session.user.id}
              onClose={() => setEditingUser(null)}
              onSave={() => {
                setPendingInvites((prev) =>
                  prev.filter((i) => i.id !== editingUser.id)
                );
                setEditingUser(null);
              }}
            />
          )}
        </>
      ) : (
        <p>There are no pending invites 🎊</p>
      )}
    </div>
  );
}

export default ManageInvites;
