"use client";

import { useState } from "react";
import { Edit2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/user-context";

export default function ProfileBio({
  actualBio,
  isOwnProfile,
}: {
  actualBio?: string;
  isOwnProfile: boolean;
}) {
  const [bio, setBio] = useState(actualBio || "");
  const router = useRouter();
  const { setUser } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const handleUpdate = async () => {
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bio }),
      });

      if (!res.ok) throw new Error("Failed to update bio");

      const data = await res.json();
      if (data.user) {
        setIsEditing(false);
        setUser((prev: any) => (prev ? { ...prev, ...data.user } : data.user));
        router.refresh();
      }
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };
  const handleCancel = () => {
    setBio(actualBio || "");
    setIsEditing(false);
  };
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Bio
      </h4>
      {!isEditing ? (
        <>
          <p className="text-sm text-foreground text-start">
            {bio || "No bio yet"}
          </p>
          {isOwnProfile ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-accent transition mt-1"
            >
              <Edit2 className="size-4" />
              Edit Bio
            </button>
          ) : null}
        </>
      ) : (
        <>
          <label
            htmlFor="bio"
            className="block mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Edit your bio
          </label>
          <textarea
            name="bio"
            value={bio}
            placeholder="Enter new bio"
            onChange={(e) => setBio(e.target.value)}
            className="w-full rounded-md border border-border bg-background/80 p-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            maxLength={80}
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-muted-foreground">{bio?.length}/80</p>
            <div className="space-x-2">
              <button
                type="button"
                onClick={handleCancel}
                className="text-xs px-3 py-1.5 rounded-md border border-border bg-muted/40 hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                className="text-xs px-3 py-1.5 rounded-md bg-accent text-accent-foreground hover:brightness-95 transition"
              >
                Save
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
