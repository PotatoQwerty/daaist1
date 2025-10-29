"use client";

import { useState } from "react";
import { Edit2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfileBio({
  actualBio,
  isOwnProfile,
}: {
  actualBio: string;
  isOwnProfile: boolean;
}) {
  const [bio, setBio] = useState(actualBio || "");
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const handleUpdate = async () => {
    try {
      const res = await fetch("/api/users/update-bio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bio }),
      });

      if (!res.ok) throw new Error("Failed to update bio");

      const data = await res.json();
      if (data.success) {
        setIsEditing(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };
  const handleCancel = () => {
    setBio(actualBio);
    setIsEditing(false);
  };
  return (
    <div className="w-full p-1 bg-background/25 rounded-lg">
      <h4 className="font-bold text-accent">Bio:</h4>
      {!isEditing ? (
        <>
          <p className="text-sm text-foreground">{bio || "No bio yet"}</p>
          {isOwnProfile ? (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-blue-500 hover:underline mt-1 flex justify-center items-center gap-1.5"
            >
              <Edit2 className="size-4" />
              Edit Bio
            </button>
          ) : null}
        </>
      ) : (
        <>
          <label htmlFor="bio" className="block mb-1 text-sm">
            Edit Your Bio
          </label>
          <textarea
            name="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-transparent p-1 text-foreground text-sm outline-none"
            maxLength={80}
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-400">{bio?.length}/80</p>
            <div className="space-x-2">
              <button
                onClick={handleCancel}
                className="text-xs text-gray-400 hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="text-xs text-green-500 hover:text-green-400"
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
