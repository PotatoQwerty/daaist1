"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Edit3 } from "lucide-react";

export default function EditProfileButton({
  isOwnProfile,
}: {
  isOwnProfile: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/users/update-image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) router.refresh();
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setLoading(false);
    }
  }

  if (!isOwnProfile) {
    return null;
  }

  return (
    <label
      className={`
        absolute bottom-0 right-0 
        flex items-center justify-center
        w-9 h-9 rounded-full
        bg-primary text-white 
        shadow-md hover:scale-110 transition-all duration-200
        cursor-pointer
      `}
    >
      <input
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept="image/*"
      />

      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-white" />
      ) : (
        <Edit3 className="w-4 h-4 text-white" />
      )}
    </label>
  );
}
