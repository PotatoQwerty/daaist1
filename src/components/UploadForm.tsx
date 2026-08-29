"use client";
import { useState, useEffect } from "react";
import RadioCard from "./RadioCard";
import Select from "react-select";
import {
  subjectOptions,
  yearOptions,
  categoryOptions,
  YearOption,
  SubjectOption,
} from "@/constants/uploadConstants";

import toast from "react-hot-toast";
import { Loader2Icon } from "lucide-react";
import { useUser } from "@/context/user-context";
// TODO: maybe create a docs table in the backend
export default function UploadForm() {
  const { session } = useUser();
  const userId = session?.user?.id || null;
  const [cat, setCat] = useState("");
  const [subjectOptionsForYear, setSubjectOptionsForYear] = useState<
    SubjectOption[] | []
  >([]);
  const [formData, setFormData] = useState<{
    title: string;
    level: YearOption | null;
    subject: SubjectOption | null;
    issum: boolean;
  }>({ title: "", level: null, subject: null, issum: false });
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: "var(--background)",
      borderColor: state.isFocused ? "var(--ring)" : "var(--border)",
      boxShadow: state.isFocused ? "0 0 0 1px var(--ring)" : "none",
      borderRadius: "0.75rem",
      minHeight: "44px",
      padding: "2px 4px",
      opacity: state.isDisabled ? 0.6 : 1,
      ":hover": {
        borderColor: "var(--ring)",
      },
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: "var(--background)",
      border: "1px solid var(--border)",
      borderRadius: "0.75rem",
      zIndex: 20,
    }),
    option: (base: any, state: any) => {
      const isActive = state.isFocused || state.isSelected;
      return {
        ...base,
        backgroundColor: isActive ? "var(--accent)" : "transparent",
        color: isActive ? "var(--accent-foreground)" : "var(--foreground)",
        cursor: "pointer",
      };
    },
    singleValue: (base: any) => ({
      ...base,
      color: "var(--foreground)",
    }),
    placeholder: (base: any) => ({
      ...base,
      color: "var(--muted-foreground)",
    }),
    input: (base: any) => ({
      ...base,
      color: "var(--foreground)",
    }),
  };

  // Update subject options dynamically & reset subject when year changes
  useEffect(() => {
    if (formData.level) {
      setSubjectOptionsForYear(subjectOptions[formData.level.value] || []);
      setFormData((prev) => ({ ...prev, subject: null }));
    } else {
      setSubjectOptionsForYear([]);
    }
  }, [formData.level]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) throw new Error("Please select a file to upload.");
    if (!userId && !session)
      throw new Error("You must be logged in to upload files.");

    setIsUploading(true);

    try {
      const body = new FormData();
      body.append("title", formData.title);
      body.append("category", cat);
      body.append("level", formData.level?.value || "");
      body.append("subject", formData.subject?.value || "");
      body.append("type", file.type);

      const res = await fetch("/api/upload-url", { method: "PUT", body });
      const dataR2 = await res.json();

      if (!res.ok) throw new Error(dataR2.message || "Upload failed.");
      await fetch(dataR2.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });
      const supabaseBody = {
        file_name: formData.title,
        url: dataR2.publicUrl,
        size: file.size,
        type: file.type,
        category: cat,
        level: formData.level?.value || null,
        subject: formData.subject?.value || null,
        issum: formData.issum,
      };
      const resSupa = await fetch("/api/files/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(supabaseBody),
      });

      const dataSupa = await resSupa.json();

      if (!resSupa.ok) {
        throw new Error(dataSupa.error || "Failed to create file record");
      }

      // reset form
      setFile(null);
      setCat("");
      setFormData({ title: "", level: null, subject: null, issum: false });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
        <div className="rounded-lg border border-border bg-card p-6 md:p-10">
          <div className="text-center space-y-2">
            <p className="annot">
              Upload
            </p>
            <h1 className="text-3xl md:text-4xl font-bold">Share a file</h1>
            <p className="text-sm text-muted-foreground">
              Help our architecture community grow by sharing your resources.
            </p>
          </div>

          <form
            className="mt-8 space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              if (file && file.size > 50 * 1024 * 1024) {
                toast.error("Select a file less than 50 MB");
                return;
              }

              toast.promise(handleSubmit(e), {
                loading: "Uploading file...",
                success: "File uploaded successfully!",
                error: (err) => `${err.message}`,
              });
            }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">
                  Category
                </label>
                <span className="text-xs text-muted-foreground">Required</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categoryOptions.map((opt) => (
                  <RadioCard
                    checked={opt.value == cat}
                    key={opt.id}
                    id={opt.id}
                    icon={opt.icon}
                    name="fileNature"
                    value={opt.value}
                    label={opt.label}
                    onChange={(e) => setCat(e.target.value)}
                    required
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">
                File Title
              </label>
              <input
                type="text"
                name="title"
                placeholder="Enter a title for your file"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full rounded-md border border-border bg-background/80 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring transition"
              />
            </div>

            {(cat === "course" || cat === "td") && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">
                      Study Year
                    </label>
                    <Select<YearOption>
                      options={yearOptions}
                      value={formData.level}
                      onChange={(selectedValue) =>
                        setFormData({ ...formData, level: selectedValue })
                      }
                      styles={selectStyles}
                      placeholder="Select study year"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">
                      Subject
                    </label>
                    <Select<SubjectOption>
                      options={subjectOptionsForYear}
                      value={formData.subject}
                      onChange={(selectedValue) =>
                        setFormData({ ...formData, subject: selectedValue })
                      }
                      styles={selectStyles}
                      placeholder={
                        formData.level
                          ? `Select a subject for ${formData.level.value}`
                          : "Select a level first"
                      }
                      isDisabled={!formData.level}
                    />
                  </div>
                </div>
                {cat === "course" && (
                  <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      title="issum"
                      name="issum"
                      id="issum"
                      className="h-4 w-4 rounded border-border accent-accent focus:ring-ring"
                      checked={formData.issum}
                      onChange={() =>
                        setFormData({ ...formData, issum: !formData.issum })
                      }
                    />
                    <span>This is a summary</span>
                  </label>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">
                Upload File
              </label>
              <input
                title="file input"
                type="file"
                name="file"
                className="w-full cursor-pointer rounded-md border border-dashed border-border bg-background/70 p-3 text-sm file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-accent-foreground hover:border-accent/60"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">
                Max file size: 50 MB.
              </p>
            </div>

            <button
              type="submit"
              disabled={isUploading}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent text-accent-foreground py-3 text-sm font-semibold shadow-sm hover:brightness-95 transition disabled:opacity-60"
            >
              {isUploading ? (
                <>
                  <span>Uploading...</span>
                  <Loader2Icon className="animate-spin size-5" />
                </>
              ) : (
                "Submit File"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
