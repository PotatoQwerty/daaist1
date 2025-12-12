"use client";

import { useState } from "react";
import { Edit2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfileBio({
  actualBio,
  isOwnProfile,
}: {
  actualBio?: string;
  isOwnProfile: boolean;
}) {
  const [bio, setBio] = useState(actualBio || "");
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const handleUpdate = async () => {
    try {
      const res = await fetch("/api/users/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bio }),
      });

      if (!res.ok) throw new Error("Failed to update bio");

      const data = await res.json();
      if (data.user) {
        setIsEditing(false);
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
      <h4 className="font-bold text-accent text-start">Bio:</h4>
      {!isEditing ? (
        <>
          <p className="text-sm text-foreground text-start">
            {bio || "No bio yet"}
          </p>
          {isOwnProfile ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-xs text-blue-500 hover:underline mt-1 flex justify-center items-center gap-1.5 justify-self-end"
            >
              <Edit2 className="size-4" />
              Edit Bio
            </button>
          ) : null}
        </>
      ) : (
        <>
          <label htmlFor="bio" className="block mb-1 text-sm text-white">
            Edit Your Bio:
          </label>
          <textarea
            name="bio"
            value={bio}
            placeholder="Enter new bio"
            onChange={(e) => setBio(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-transparent p-1 text-foreground text-sm outline-none"
            maxLength={80}
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-400">{bio?.length}/80</p>
            <div className="space-x-2">
              <button
                type="button"
                onClick={handleCancel}
                className="text-xs p-2 rounded-md hover:bg-gray-600 bg-gray-200 hover:text-white "
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                className="text-xs bg-green-400 p-2 rounded-md hover:bg-green-600 hover:text-white "
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
