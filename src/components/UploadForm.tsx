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
} from "../../constants/uploadConstants";

export default function UploadForm() {
  const [cat, setCat] = useState("");
  const [subjectOption, setSubjectOption] = useState<SubjectOption[] | null>(
    null
  );
  const [formData, SetFormData] = useState<{
    title: string;
    level: YearOption | null;
    subject: SubjectOption | null;
  }>({ title: "", subject: null, level: null });

  const [file, SetFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (formData.level) {
      setSubjectOption(subjectOptions[formData.level.value]);
    } else {
      setSubjectOption(null);
    }
  }, [formData.level]);

  // 🟢 Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMessage("❌ Please select a file first");
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const data = new FormData();
      data.append("file", file);
      data.append("year", formData.level?.value || "unknown");
      data.append("cat", cat || "misc");
      data.append("level", formData.level?.value || "");
      data.append("title", formData.title || "");
      data.append("subject", formData.subject?.value || "");

      const response = await fetch(
        "https://neural-climbing-ampland-requests.trycloudflare.com/upload",
        {
          method: "POST",
          body: data,
        }
      );

      const result = await response.json();

      if (response.ok) {
        setMessage(`✅ Uploaded successfully: ${result.metadata.title}`);
        //add functionality to reset after successful
      } else {
        setMessage(`❌ Upload failed: ${result.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setMessage("⚠️ Failed to upload. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-10 relative overflow-hidden">
      {/* Background shapes */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-primary rounded-full opacity-20"></div>
      <div className="absolute bottom-10 right-20 w-24 h-24 bg-secondary rotate-12"></div>
      <div className="absolute bottom-20 left-20 w-48 h-4 bg-accent"></div>

      {/* Main Card */}
      <div className="relative z-10 bg-accent/30 rounded-2xl shadow-lg border-4 border-foreground p-10 w-full max-w-xl">
        <h1 className="text-3xl font-bold uppercase text-center text-primary mb-6">
          Upload a File
        </h1>
        <p className="text-center mb-8">
          Help our architecture database grow by sharing your documents 📐
        </p>

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          {/* Category Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {categoryOptions.map((opt) => (
              <RadioCard
                key={opt.id}
                id={opt.id}
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
            <label className="block text-sm font-semibold text-primary mb-2">
              File Title
            </label>
            <input
              type="text"
              name="title"
              placeholder="Enter a title for your file"
              value={formData.title}
              onChange={(e) =>
                SetFormData({ ...formData, title: e.target.value })
              }
              className="w-full border-2 border-accent rounded-md p-3 focus:outline-none focus:border-primary transition"
            />
          </div>

          {/* Year + Subject Selects */}
          {(cat === "course" || cat === "td") && (
            <div className="flex flex-col gap-4">
              <Select<YearOption>
                options={yearOptions}
                value={formData.level}
                onChange={(selectedValue) =>
                  SetFormData({ ...formData, level: selectedValue })
                }
                className="text-black"
                placeholder="Select study year"
              />

              <Select<SubjectOption>
                options={subjectOption || []}
                value={formData.subject}
                onChange={(selectedValue) =>
                  SetFormData({ ...formData, subject: selectedValue })
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
            <label className="block text-sm font-semibold text-primary mb-2">
              Upload File
            </label>
            <input
              type="file"
              name="file"
              className="w-full border-2 border-dashed border-accent rounded-md p-3 bg-primary/50 hover:bg-primary/80 cursor-pointer file:cursor-pointer file:border-none file:mr-3 file:py-2 file:px-4 file:rounded-md file:bg-primary file:text-white"
              onChange={(e) => SetFile(e.target.files?.[0] || null)}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isUploading}
            className="mt-4 bg-primary text-white font-semibold py-3 rounded-md hover:bg-secondary transition disabled:opacity-50"
          >
            {isUploading ? "Uploading..." : "Submit File"}
          </button>
        </form>

        {/* Status Message */}
        {message && (
          <p className="mt-4 text-center text-sm text-gray-700 dark:text-gray-200">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
