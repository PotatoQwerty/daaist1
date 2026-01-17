"use client";

import { Edit3, Loader2 } from "lucide-react";
import Image, { StaticImageData } from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useUser } from "@/context/user-context";

export default function EditProfileButton({
  isOwnProfile,
  currentImage,
}: {
  isOwnProfile: boolean;
  currentImage: string | StaticImageData;
}) {
  const [image, setImage] = useState<string>();
  const { setUser } = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await fetch("/api/users/update-image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);
      if (data.imageUrl) {
        setImage(data.imageUrl);
        setUser((prev) =>
          prev ? { ...prev, image: data.imageUrl } : prev
        );
        router.refresh();
      }
    } catch (error: any) {
      console.error("Upload failed:", error);
      toast.error(error.message || "Upload failed ❌");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative w-36 h-36 shrink-0">
      <Image
        src={image || currentImage}
        alt="Profile"
        fill
        className="object-cover rounded-full border-4 border-accent shadow-lg"
        sizes="144px"
        priority
      />

      {isOwnProfile && (
        <label
          className="
            absolute bottom-0 right-0
            flex items-center justify-center
            w-9 h-9 rounded-full
            bg-primary text-white
            shadow-md hover:scale-110 transition-all duration-200
            cursor-pointer
          "
        >
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              // Handle size check before starting the toast.promise
              if (file.size > 5 * 1024 * 1024) {
                toast.error("Please select an image <= 5MB");
                return;
              }

              toast.promise(handleFileChange(e), {
                loading: "Uploading profile picture...",
                success: "Profile picture changed successfully 🎊",
                error: (err: any) => err?.message || "Upload failed ❌",
              });
            }}
          />

          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Edit3 className="w-4 h-4 text-white" />
          )}
        </label>
      )}
    </div>
  );
}
