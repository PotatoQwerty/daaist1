"use client";
import { fetchUsers } from "@/lib/supabase/actions";
import { useState, useEffect } from "react";
import Select from "react-select";
import { Button } from "@/components/ui/button";
import { Trash, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { useUser } from "@/context/user-context";

const ROLES = [
  { value: "member", label: "Member" },
  { value: "vice_president", label: "Vice President" },
  { value: "event_manager", label: "Event Manager" },
];

const ManageClubMembers = ({ club }: { club: any }) => {
  const { user: currentUser } = useUser();
  const [clubMembers, setClubMembers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<any>(ROLES[0]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchClubMembers = async () => {
      const response = await fetch(`/api/club/members?club_id=${club.id}`);
      const data = await response.json();
      if (data.data) setClubMembers(data.data);
    };

    fetchClubMembers();
  }, [club.id]);

  useEffect(() => {
    if (!clubMembers.length) return;

    const getUsers = async () => {
      const allUsers = await fetchUsers();

      setUsers(
        allUsers
          .filter((u: any) => {
            const isComplete = u.firstname && u.lastname && u.username;
            const isAlreadyMember = clubMembers.some(
              (m: any) => m.profiles.user_id === u.user_id,
            );

            return isComplete && !isAlreadyMember;
          })
          .map((u: any) => ({
            value: u.user_id,
            label: `${u.firstname} ${u.lastname} (@${u.username})`,
          })),
      );
    };

    getUsers();
  }, [clubMembers]);

  const customStyles = {
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: "var(--background)",
      borderColor: "var(--border)",
      color: "var(--foreground)",
    }),
    singleValue: (base: any) => ({
      ...base,
      color: "var(--foreground)",
    }),
    input: (base: any) => ({
      ...base,
      color: "var(--foreground)",
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: "var(--background)",
      border: "1px solid var(--border)",
      zIndex: 9999,
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? "var(--accent)" : "var(--background)",
      color: state.isFocused ? "var(--accent-foreground)" : "var(--foreground)",
      cursor: "pointer",
    }),
  };

  const addClubMember = async () => {
    if (!selectedUser || !selectedRole) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/club/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          club_id: club.id,
          user_id: selectedUser.value,
          role: selectedRole.value,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        const res = await fetch(`/api/club/members?club_id=${club.id}`);
        const newData = await res.json();
        setClubMembers(newData.data || []);
        setSelectedUser(null);
        toast.success("Member added successfully!");
      } else {
        toast.error("Failed to add member: " + data.error);
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  const deleteClubMember = async (memberId: string) => {
    const res = await fetch(`/api/club/members`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        club_id: club.id,
        id: memberId,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      const res = await fetch(`/api/club/members?club_id=${club.id}`);
      const newData = await res.json();
      setClubMembers(newData.data || []);
      toast.success("Member deleted successfully!");
    } else {
      toast.error("Failed to delete member: " + data.error);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
        <h3 className="font-semibold flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Add New Member
        </h3>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <Select
              options={users}
              value={selectedUser}
              onChange={setSelectedUser}
              placeholder="Select a user..."
              className="text-sm"
              classNamePrefix="react-select"
              styles={customStyles}
            />
          </div>
          <div className="w-full md:w-48">
            <Select
              options={ROLES}
              value={selectedRole}
              onChange={setSelectedRole}
              placeholder="Select Role"
              className="text-sm"
              classNamePrefix="react-select"
              styles={customStyles}
            />
          </div>
          <Button
            onClick={addClubMember}
            disabled={isLoading || !selectedUser}
            className="w-full md:w-auto"
          >
            {isLoading ? "Adding..." : "Add Member"}
          </Button>
        </div>
      </div>

      {/* Members Table */}
      <div className="border rounded-lg overflow-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left font-medium p-3">User</th>
              <th className="text-left font-medium p-3">Role</th>
              <th className="text-left font-medium p-3 hidden sm:table-cell">
                Joined
              </th>
              <th className="text-right font-medium p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clubMembers.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="p-4 text-center text-muted-foreground"
                >
                  No members yet.
                </td>
              </tr>
            ) : (
              clubMembers.map((member: any) => (
                <tr
                  key={member.id}
                  className="border-b last:border-0 hover:bg-muted/20"
                >
                  <td className="p-3">
                    <div className="font-medium">
                      {member.profiles?.firstname} {member.profiles?.lastname}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      @{member.profiles?.username}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="capitalize bg-secondary/10 px-2 py-1 rounded-full text-xs font-medium border border-secondary/20 whitespace-nowrap">
                      {member.role?.replace("club_", "").replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground hidden sm:table-cell">
                    {new Date(member.joined_at).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      onClick={() =>
                        Swal.fire({
                          title: "Are you sure?",
                          text: "You will delete this member!",
                          icon: "warning",
                          showCancelButton: true,
                          confirmButtonColor: "#3085d6",
                          cancelButtonColor: "#d33",
                          confirmButtonText: "Yes, delete member!",
                        }).then((result) => {
                          if (result.isConfirmed) {
                            deleteClubMember(member.id);
                          }
                        })
                      }
                      variant="ghost"
                      size="sm"
                      disabled={
                        currentUser?.user_id === member.profiles?.user_id
                      }
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0 cursor-pointer disabled:bg-gray-500 disabled:text-white disabled:cursor-not-allowed"
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageClubMembers;
