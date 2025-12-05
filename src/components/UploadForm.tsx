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
import { supabaseClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { Loader2Icon } from "lucide-react";
import { useSession } from "next-auth/react";
//TODO: maybe create a docs table in the backend
export default function UploadForm() {
  const { data: session } = useSession();
  const userId = session?.user.id || null;
  const [cat, setCat] = useState("");
  const [subjectOptionsForYear, setSubjectOptionsForYear] = useState<
    SubjectOption[] | []
  >([]);
  const [formData, setFormData] = useState<{
    title: string;
    level: YearOption | null;
    subject: SubjectOption | null;
  }>({ title: "", level: null, subject: null });
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
    if (!userId) throw new Error("You must be logged in to upload files.");

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

      const { error } = await supabaseClient.from("files").insert({
        file_name: formData.title,
        url: dataR2.publicUrl,
        size: file.size,
        type: file.type,
        category: cat,
        level: formData.level?.value || null,
        subject: formData.subject?.value || null,
        uploaded_by: userId,
      });

      if (error) throw new Error(error.message);

      // reset form
      setFile(null);
      setCat("");
      setFormData({ title: "", level: null, subject: null });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5 md:p-10 relative overflow-hidden">
      {/* Background shapes */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-primary rounded-full opacity-20" />
      <div className="absolute bottom-10 rotate-8 w-48 h-4 bg-accent" />

      <div className="relative z-10 bg-accent/30 rounded-2xl shadow-lg border-4 border-foreground p-5 md:p-10 w-full max-w-xl">
        <h1 className="text-3xl font-bold uppercase text-center text-secondary mb-6">
          Upload a File
        </h1>
        <p className="text-center mb-8">
          Help our architecture database grow by sharing your documents 📐
        </p>

        <form
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (file && file.size > 50 * 1024 * 1024) {
              toast.error("Select a file less than 50 MB");
              return;
            }

            toast.promise(handleSubmit(e), {
              loading: "Uploading file...",
              success: "File uploaded successfully! 🎊",
              error: (err) => `${err.message} ❌`,
            });
          }}
        >
          {/* Category */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-4">
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

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
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
              className="w-full border-2 border-accent rounded-md p-3 focus:outline-none focus:border-primary transition"
            />
          </div>

          {/* Year + Subject */}
          {(cat === "course" || cat === "td") && (
            <div className="flex flex-col gap-4">
              <Select<YearOption>
                options={yearOptions}
                value={formData.level}
                onChange={(selectedValue) =>
                  setFormData({ ...formData, level: selectedValue })
                }
                className="text-black"
                placeholder="Select study year"
              />

              <Select<SubjectOption>
                options={subjectOptionsForYear}
                value={formData.subject}
                onChange={(selectedValue) =>
                  setFormData({ ...formData, subject: selectedValue })
                }
                className="text-black"
                placeholder={
                  formData.level
                    ? `Select a subject for ${formData.level.value}`
                    : "Select a level first"
                }
                isDisabled={!formData.level}
              />
            </div>
          )}

          {/* File Input */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Upload File
            </label>
            <input
              type="file"
              name="file"
              className="w-full border-2 border-dashed border-accent rounded-md p-3 bg-primary/50 hover:bg-primary/80 cursor-pointer file:cursor-pointer file:border-none file:mr-3 file:py-2 file:px-4 file:rounded-md file:bg-primary file:text-white"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isUploading}
            className="mt-4 bg-primary text-white flex w-full gap-2 justify-center items-center font-semibold py-3 rounded-md hover:bg-secondary transition disabled:opacity-50"
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
  );
}
