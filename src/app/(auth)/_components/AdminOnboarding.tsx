"use client";

import React, { useState, useRef } from "react";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { ParamValue } from "next/dist/server/request/params";
import { useSession } from "next-auth/react";
import { redirect, RedirectType } from "next/navigation";
function AdminOnboarding({ token }: { token: ParamValue }) {
  const formRef = useRef<HTMLDivElement>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [form, setForm] = useState<{
    firstname: string;
    lastname: string;
    // email: string;
    // department: string;
    phone: string;
    username: string;
  }>({
    firstname: "",
    lastname: "",
    // email: "",
    username: "",
    // department: "",
    phone: "",
  });
  const { data: session, status } = useSession();
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const body = { form, token };

    await toast.promise(
      (async () => {
        const res = await fetch("/api/admin/onboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.error || "Onboarding failed");
        }

        return res.json();
      })(),
      {
        loading: "Onboarding…",
        success: "Onboarding completed",
        error: (err) => err.message || "Something went wrong",
      }
    );

    setSubmitting(false);
    redirect("/admin", RedirectType.replace);
  };

  if (status == "loading" && !session)
    return (
      <div className="w-full h-screen items-center justify-center">
        <span className="flex gap-1">
          <Loader2 className="size-5 animate-spin" />
          Loading...
        </span>
      </div>
    );
  return (
    <div
      className="w-full flex flex-col justify-center items-center px-6 md:px-12 py-10"
      ref={formRef}
    >
      <div className="w-full max-w-lg space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-4xl font-extrabold text-primary uppercase tracking-tight">
            Admin Sign Up
          </h2>
          <p className="text-accent text-lg">
            Complete your admin profile to start managing DAA'ist
          </p>
        </div>

        <form
          aria-label="Admin Sign up Form"
          className="flex flex-col gap-6"
          method="POST"
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <input
              onChange={handleChange}
              type="text"
              name="lastname"
              value={form.lastname}
              required
              placeholder="Last name"
              className="w-full border border-gray-300 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-gray-400"
            />
            <input
              onChange={handleChange}
              type="text"
              name="firstname"
              value={form.firstname}
              required
              placeholder="First name"
              className="w-full border border-gray-300 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-gray-400"
            />
          </div>

          <input
            onChange={handleChange}
            type="text"
            name="username"
            value={form.username}
            required
            placeholder="username"
            className="w-full border border-gray-300 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-gray-400"
          />
          {/* <input
            onChange={handleChange}
            type="email"
            name="email"
            value={form.email}
            required
            placeholder="Email address"
            className="w-full border border-gray-300 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-gray-400"
          /> */}

          <input
            onChange={handleChange}
            type="tel"
            name="phone"
            value={form.phone}
            placeholder="Phone number"
            className="w-full border border-gray-300 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-gray-400"
          />

          {/* <input
            onChange={handleChange}
            type="text"
            name="department"
            value={form.department}
            required
            placeholder="Department"
            className="w-full border border-gray-300 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-gray-400"
          /> */}

          <button
            type="submit"
            disabled={submitting}
            className="bg-primary mt-4 flex gap-2 justify-center items-center text-white p-4 rounded-xl font-bold text-lg hover:bg-blue-800 transition shadow-lg shadow-blue-500/20 active:scale-[0.98] cursor-pointer"
          >
            {submitting ? <Loader2 className="animate-spin" /> : "Create Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminOnboarding;
