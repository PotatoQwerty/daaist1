"use client";
import React, { useState, useEffect } from "react";
import { Upload, Image, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Select from "react-select";
import { fetchUsers } from "@/lib/supabase/actions";
import { toast } from "react-hot-toast";

function CreateClubForm() {
  const [clubData, setClubData] = useState({
    name: "",
    slug: "",
    description: "",
    logo_url: "",
    banner_url: "",
    socials: {
      facebook: "",
      instagram: "",
      tiktok: "",
    },
    is_active: true,
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File>();
  const [bannerFile, setBannerFile] = useState<File>();
  const [users, setUsers] = useState<any[]>([]);
  const [presidentId, setPresidentId] = useState<string>("");

  useEffect(() => {
    const loadUsers = async () => {
      const fetchedUsers = await fetchUsers();
      if (fetchedUsers) {
        setUsers(
          fetchedUsers
            .filter((user) => user.firstname && user.lastname)
            .map((u) => ({
              value: u.user_id,
              label: `${u.firstname} ${u.lastname} (@${u.username})`,
            }))
        );
      }
    };
    loadUsers();
  }, []);

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

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    setClubData({ ...clubData, name, slug });
    if (errors.name) {
      const newErrors = { ...errors };
      delete newErrors.name;
      setErrors(newErrors);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setClubData({
      ...clubData,
      [name]: type === "checkbox" ? checked : value,
    });

    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "banner"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setErrors({ ...errors, [type]: "Please select an image file" });
        return;
      }

      if (type === "logo") {
        setLogoFile(file);
      } else {
        setBannerFile(file);
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (type === "logo") {
          setLogoPreview(result);

          setClubData({ ...clubData, logo_url: result });
        } else {
          setBannerPreview(result);
          setClubData({ ...clubData, banner_url: result });
        }
      };

      reader.readAsDataURL(file);

      const newErrors = { ...errors };
      delete newErrors[type];
      setErrors(newErrors);
    }
  };

  const removeImage = (type: "logo" | "banner") => {
    if (type === "logo") {
      setLogoPreview(null);
      setClubData({ ...clubData, logo_url: "" });
    } else {
      setBannerPreview(null);
      setClubData({ ...clubData, banner_url: "" });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!clubData.name.trim()) {
      newErrors.name = "Club name is required";
    }

    if (!clubData.slug.trim()) {
      newErrors.slug = "Slug is required";
    }

    if (!clubData.description.trim()) {
      newErrors.description = "Description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      setIsSubmitting(true);
      if (!logoFile || !bannerFile || !presidentId) {
        setErrors({
          ...errors,
          submit: "Please upload both logo and banner and assign a president",
        });
        setIsSubmitting(false);
        return;
      }
      try {
        // 5 create club with api

        const formData = new FormData();
        formData.append("name", clubData.name);
        formData.append("slug", clubData.slug);
        formData.append("description", clubData.description);
        formData.append("logoFile", logoFile);
        formData.append("bannerFile", bannerFile);
        formData.append("is_active", JSON.stringify(clubData.is_active));
        formData.append("president_id", presidentId);
        formData.append("facebook", clubData.socials.facebook);
        formData.append("instagram", clubData.socials.instagram);
        formData.append("tiktok", clubData.socials.tiktok);

        const res = await fetch("/api/admin/clubs/create", {
          body: formData,
          method: "POST",
        });
        const data = await res.json();
        if (!res.ok) throw data;

        toast.success("Club created successfully!");

        // Reset form
        setClubData({
          name: "",
          slug: "",
          description: "",
          logo_url: "",
          banner_url: "",
          is_active: true,
          socials: { facebook: "", instagram: "", tiktok: "" },
        });
        setLogoFile(undefined);
        setBannerFile(undefined);
        setLogoPreview(null);
        setBannerPreview(null);
        setPresidentId("");
        setErrors({});
      } catch (error) {
        console.error("Error creating club:", error);
        setErrors({
          ...errors,
          submit:
            error instanceof Error ? error.message : "Failed to create club",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-10 flex justify-center">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground kabel-bold">
            Create New Club
          </h1>
          <p className="text-muted-foreground text-lg">
            Establish a new community space for students.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-8">
            <div className="bg-card rounded-xl border shadow-sm p-6 space-y-6">
              <h2 className="text-xl font-semibold kabel-bold flex items-center gap-2">
                Basic Info
              </h2>

              {/* Name */}
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Club Name <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  value={clubData.name}
                  onChange={handleNameChange}
                  className={
                    errors.name
                      ? "border-destructive focus-visible:ring-destructive/20"
                      : ""
                  }
                  placeholder="e.g., Photography Club"
                />
                {errors.name && (
                  <p className="text-sm text-destructive font-medium">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <label
                  htmlFor="slug"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Slug{" "}
                  <span className="text-muted-foreground font-normal">
                    (auto-generated)
                  </span>
                </label>
                <Input
                  type="text"
                  id="slug"
                  name="slug"
                  value={clubData.slug}
                  onChange={handleInputChange} // Note: Usually slugs are read-only or manual edit is rare if auto-generated, keeping as editable per original code
                  className={`bg-muted/50 ${
                    errors.slug ? "border-destructive" : ""
                  }`}
                  placeholder="photography-club"
                />
                {errors.slug && (
                  <p className="text-sm text-destructive font-medium">
                    {errors.slug}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label
                  htmlFor="description"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Description <span className="text-destructive">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={clubData.description}
                  onChange={handleInputChange}
                  rows={5}
                  className={cn(
                    "flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    errors.description
                      ? "border-destructive focus-visible:ring-destructive/20"
                      : ""
                  )}
                  placeholder="Describe your club and what makes it special..."
                />
                {errors.description && (
                  <p className="text-sm text-destructive font-medium">
                    {errors.description}
                  </p>
                )}
              </div>
            </div>

            {/* Club Leadership */}
            <div className="bg-card rounded-xl border shadow-sm p-6 space-y-6">
              <h2 className="text-xl font-semibold kabel-bold flex items-center gap-2">
                Club Leadership
              </h2>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  Club President <span className="text-destructive">*</span>
                </label>
                <Select
                  options={users}
                  value={users.find((u) => u.value === presidentId)}
                  onChange={(option: any) =>
                    setPresidentId(option?.value || "")
                  }
                  placeholder="Select a president..."
                  className="text-sm"
                  classNamePrefix="react-select"
                  styles={customStyles}
                />
                <p className="text-xs text-muted-foreground">
                  The selected user will be assigned as the Club President.
                </p>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="bg-card rounded-xl border shadow-sm p-6 space-y-6">
              <h2 className="text-xl font-semibold kabel-bold flex items-center gap-2">
                Social Media
              </h2>

              {/* Facebook */}
              <div className="space-y-2">
                <label
                  htmlFor="facebook"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Facebook URL
                </label>
                <Input
                  type="url"
                  id="facebook"
                  name="facebook"
                  value={clubData.socials.facebook}
                  onChange={(e) =>
                    setClubData({
                      ...clubData,
                      socials: {
                        ...clubData.socials,
                        facebook: e.target.value,
                      },
                    })
                  }
                  placeholder="https://facebook.com/..."
                />
              </div>

              {/* Instagram */}
              <div className="space-y-2">
                <label
                  htmlFor="instagram"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Instagram URL
                </label>
                <Input
                  type="url"
                  id="instagram"
                  name="instagram"
                  value={clubData.socials.instagram}
                  onChange={(e) =>
                    setClubData({
                      ...clubData,
                      socials: {
                        ...clubData.socials,
                        instagram: e.target.value,
                      },
                    })
                  }
                  placeholder="https://instagram.com/..."
                />
              </div>

              {/* TikTok */}
              <div className="space-y-2">
                <label
                  htmlFor="tiktok"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  TikTok URL
                </label>
                <Input
                  type="url"
                  id="tiktok"
                  name="tiktok"
                  value={clubData.socials.tiktok}
                  onChange={(e) =>
                    setClubData({
                      ...clubData,
                      socials: { ...clubData.socials, tiktok: e.target.value },
                    })
                  }
                  placeholder="https://tiktok.com/..."
                />
              </div>
            </div>

            {/* Media Uploads */}
            <div className="bg-card rounded-xl border shadow-sm p-6 space-y-6">
              <h2 className="text-xl font-semibold kabel-bold flex items-center gap-2">
                Branding
              </h2>

              {/* Logo Upload */}
              <div className="space-y-3">
                <label className="text-sm font-medium leading-none">
                  Club Logo
                </label>

                {logoPreview ? (
                  <div className="relative inline-block group">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-32 h-32 rounded-xl object-cover border-2 border-border shadow-sm transition-transform group-hover:scale-[1.02]"
                    />
                    <button
                      title="remove logo"
                      type="button"
                      onClick={() => removeImage("logo")}
                      className="absolute -top-2 -right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-muted-foreground/25 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all group">
                    <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-[10px] uppercase font-bold text-muted-foreground mt-2">
                      Upload Logo
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "logo")}
                      className="hidden"
                    />
                  </label>
                )}
                {errors.logo && (
                  <p className="text-sm text-destructive font-medium">
                    {errors.logo}
                  </p>
                )}
              </div>

              {/* Banner Upload */}
              <div className="space-y-3">
                <label className="text-sm font-medium leading-none">
                  Club Banner
                </label>

                {bannerPreview ? (
                  <div className="relative group rounded-xl overflow-hidden border border-border ">
                    <img
                      src={bannerPreview}
                      alt="Banner preview"
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <button
                      title="remove banner"
                      type="button"
                      onClick={() => removeImage("banner")}
                      className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-muted-foreground/25 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all group">
                    <div className="p-4 bg-background rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                      <Image className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      Click to upload banner
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      1200x400 recommended
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "banner")}
                      className="hidden"
                    />
                  </label>
                )}
                {errors.banner && (
                  <p className="text-sm text-destructive font-medium">
                    {errors.banner}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-card rounded-xl border shadow-sm p-6 space-y-6">
              <h3 className="font-semibold text-lg kabel-bold">Settings</h3>

              {/* Is Active */}
              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-transparent hover:border-border transition-colors">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={clubData.is_active}
                  onChange={handleInputChange}
                  className="mt-1 w-4 h-4 text-primary rounded border-input focus:ring-primary"
                />
                <div>
                  <label
                    htmlFor="is_active"
                    className="text-sm font-medium text-foreground cursor-pointer"
                  >
                    Active Status
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Visible to all members
                  </p>
                </div>
              </div>
            </div>

            <div className="sticky top-6 space-y-4">
              <Button
                onClick={handleSubmit}
                className="w-full text-base py-6 shadow-md shadow-primary/20"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Club"
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateClubForm;
