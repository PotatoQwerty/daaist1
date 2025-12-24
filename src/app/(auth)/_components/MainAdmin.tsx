"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Copy, Link as LinkIcon, Shield, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function MainAdmin() {
  const [inviteLink, setInviteLink] = useState("");
  const [role, setRole] = useState("teacher");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateLink = async () => {
    if (!role) {
      toast.error("Please select a role");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (!res.ok) {
        throw new Error("Failed to create invite");
      }

      const data = await res.json();
      setInviteLink(data.link);
      toast.success("Invite link created!");
    } catch (error) {
      toast.error("Failed to create invite");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* Invite Creation Card */}
      <div className="bg-card text-card-foreground border rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Create Invite</h2>
            <p className="text-muted-foreground">
              Generate a unique invitation link for new members.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3 items-end">
            <div className="md:col-span-2 space-y-2">
              <label
                htmlFor="role"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Role Assignment
              </label>
              <div className="relative">
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                >
                  <option value="admin">Admin</option>
                  <option value="teacher">Teacher</option>
                </select>
                <div className="absolute right-3 top-2.5 pointer-events-none text-muted-foreground">
                  {role === "admin" ? (
                    <Shield className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
              </div>
            </div>

            <Button
              onClick={handleCreateLink}
              disabled={isLoading}
              className="w-full font-bold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Create Link
                </>
              )}
            </Button>
          </div>

          {inviteLink && (
            <div className="space-y-2 pt-4 animate-in fade-in slide-in-from-top-4 duration-300">
              <label className="text-sm font-medium">Generated Link</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
                  {inviteLink}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  className="shrink-0"
                  title="Copy link"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MainAdmin;
