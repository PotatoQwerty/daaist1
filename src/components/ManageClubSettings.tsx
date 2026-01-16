"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Settings, Upload, Save } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";

interface ManageClubSettingsProps {
  club: any;
}

const ManageClubSettings = ({ club }: ManageClubSettingsProps) => {
  const router = useRouter();
  const [description, setDescription] = useState(club.description || "");
  const [facebook, setFacebook] = useState(club.socials?.facebook || "");
  const [instagram, setInstagram] = useState(club.socials?.instagram || "");
  const [tiktok, setTiktok] = useState(club.socials?.tiktok || "");
  const [isActive, setIsActive] = useState(club.is_active ?? true);
  const [isLoading, setIsLoading] = useState(false);

  // Image states
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    club.logo_url || null,
  );
  const [bannerPreview, setBannerPreview] = useState<string | null>(
    club.banner_url || null,
  );

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

    if (file) {
      if (!file.type.startsWith("image/")) {
        const errorMsg = "Please select an image file";
        toast.error(errorMsg);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        const errorMsg = "Logo file size must be less than 15MB";
        toast.error(errorMsg);
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

    if (file) {
      if (!file.type.startsWith("image/")) {
        const errorMsg = "Please select an image file";
        toast.error(errorMsg);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        const errorMsg = "Banner file size must be less than 15MB";
        toast.error(errorMsg);
        return;
      }

      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadFileToR2 = async (
    file: File,
    category: string,
  ): Promise<string | null> => {
    const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

    try {
      if (file.size > MAX_FILE_SIZE) {
        const errorMsg = "File size must be less than 15MB";
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }

      // Get signed URL from the API
      const formData = new FormData();
      formData.append("title", file.name);
      formData.append("category", category);
      formData.append("type", file.type);

      const uploadUrlRes = await fetch("/api/upload-url", {
        method: "PUT",
        body: formData,
      });

      if (!uploadUrlRes.ok) {
        throw new Error("Failed to get signed upload URL");
      }

      const { uploadUrl, publicUrl } = await uploadUrlRes.json();

      // Upload file to R2 using signed URL
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload file to R2");
      }

      return publicUrl;
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to upload file";
      console.error("Error uploading file:", error);
      toast.error(errorMsg);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let logoUrl = club.logo_url;
      let bannerUrl = club.banner_url;

      // Upload files to R2 if they were changed
      if (logoFile) {
        const uploadedLogoUrl = await uploadFileToR2(logoFile, "clubs/logo");
        if (!uploadedLogoUrl) {
          setIsLoading(false);
          return;
        }
        logoUrl = uploadedLogoUrl;
      }

      if (bannerFile) {
        const uploadedBannerUrl = await uploadFileToR2(
          bannerFile,
          "clubs/banner",
        );
        if (!uploadedBannerUrl) {
          setIsLoading(false);
          return;
        }
        bannerUrl = uploadedBannerUrl;
      }

      const formData = new FormData();
      formData.append("club_id", club.id);
      formData.append("description", description);
      formData.append("facebook", facebook);
      formData.append("instagram", instagram);
      formData.append("tiktok", tiktok);
      formData.append("is_active", isActive.toString());
      formData.append("logo_url", logoUrl);
      formData.append("banner_url", bannerUrl);

      const response = await fetch("/api/admin/clubs/settings", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Club settings updated successfully!");
        // Refresh to show updated data without full page reload
        router.refresh();
      } else {
        toast.error(data.error || "Failed to update club settings");
      }
    } catch (error) {
      console.error("Error updating club settings:", error);
      toast.error("An error occurred while updating settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Club Settings</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Club Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter club description..."
            rows={6}
            className="resize-none"
          />
        </div>

        {/* Social Links */}
        <div className="space-y-4">
          <h4 className="font-medium">Social Media Links</h4>

          <div className="space-y-2">
            <Label htmlFor="facebook">Facebook</Label>
            <Input
              id="facebook"
              type="url"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              placeholder="https://facebook.com/yourclub"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <Input
              id="instagram"
              type="url"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="https://instagram.com/yourclub"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tiktok">TikTok</Label>
            <Input
              id="tiktok"
              type="url"
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value)}
              placeholder="https://tiktok.com/@yourclub"
            />
          </div>
        </div>

        {/* Logo Upload */}
        <div className="space-y-4">
          <h4 className="font-medium">Club Logo</h4>
          <div className="flex flex-col md:flex-row items-start gap-4">
            {logoPreview && (
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-border bg-muted">
                <Image
                  src={logoPreview}
                  alt="Logo preview"
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <Label htmlFor="logo" className="cursor-pointer">
                <div className="flex items-center gap-2 p-4 border-2 border-dashed rounded-lg hover:border-primary transition-colors">
                  <Upload className="w-5 h-5" />
                  <span>
                    {logoFile ? logoFile.name : "Click to upload logo"}
                  </span>
                </div>
              </Label>
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">
                Recommended: Square image, max 15MB
              </p>
            </div>
          </div>
        </div>

        {/* Banner Upload */}
        <div className="space-y-4">
          <h4 className="font-medium">Club Banner</h4>
          <div className="flex flex-col gap-4">
            {bannerPreview && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-border bg-muted">
                <Image
                  src={bannerPreview}
                  alt="Banner preview"
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="banner" className="cursor-pointer">
                <div className="flex items-center gap-2 p-4 border-2 border-dashed rounded-lg hover:border-primary transition-colors">
                  <Upload className="w-5 h-5" />
                  <span>
                    {bannerFile ? bannerFile.name : "Click to upload banner"}
                  </span>
                </div>
              </Label>
              <Input
                id="banner"
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 16:9 ratio, max 15MB
              </p>
            </div>
          </div>
        </div>

        {/* Active Status */}
        <div className="flex items-center space-x-3 p-4 border rounded-lg">
          <input
            type="checkbox"
            id="is_active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
          />
          <div className="flex-1">
            <Label htmlFor="is_active" className="cursor-pointer">
              Club Active Status
            </Label>
            <p className="text-sm text-muted-foreground">
              {isActive
                ? "Club is currently active and visible to all users"
                : "Club is inactive and hidden from public view"}
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button type="submit" disabled={isLoading} size="lg">
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ManageClubSettings;
