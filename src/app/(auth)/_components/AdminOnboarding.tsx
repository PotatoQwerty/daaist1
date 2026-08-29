"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { validateUsername } from "@/lib/username";

type FormState = {
  firstname: string;
  lastname: string;
  phone: string;
  username: string;
};

const inputClass =
  "w-full rounded-md border border-input bg-background p-3.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-ring focus:outline-none";

function AdminOnboarding({
  token,
  roleLabel,
}: {
  token: string | undefined;
  /** What the invite grants, so the form states what is being accepted. */
  roleLabel: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    firstname: "",
    lastname: "",
    username: "",
    phone: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "username") setUsernameError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    // Same rule the server enforces, so the person is told before a round trip
    // that costs them their single-use invite.
    const check = validateUsername(form.username);
    if (!check.ok) {
      setUsernameError(check.error);
      return;
    }

    setSubmitting(true);

    // try/finally: previously a rejected request threw out of the handler, so
    // setSubmitting(false) never ran and the button stayed disabled for good.
    try {
      const res = await fetch("/api/admin/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, form: { ...form, username: check.username } }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 409 && data.error?.includes("username")) {
          setUsernameError(data.error);
        }
        toast.error(data.error || "Could not complete setup.");
        return;
      }

      toast.success(`You're set up as ${data.roleLabel ?? roleLabel}.`);
      // router.replace, not redirect(): redirect() throws NEXT_REDIRECT, which
      // inside an event handler surfaces as an unhandled rejection.
      router.replace("/admin");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg py-16">
      <div className="h-1 w-16 bg-primary" aria-hidden="true" />

      <h1 className="mt-6 text-3xl leading-tight font-bold sm:text-4xl">
        Set up your {roleLabel.toLowerCase()} account.
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        This invite works once. Fill it in now and you&apos;ll be signed
        straight into the dashboard.
      </p>

      <form
        aria-label={`${roleLabel} sign-up`}
        className="mt-10 flex flex-col gap-5"
        onSubmit={handleSubmit}
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="firstname" className="text-sm font-bold">
              First name
            </label>
            <input
              id="firstname"
              name="firstname"
              type="text"
              required
              value={form.firstname}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="lastname" className="text-sm font-bold">
              Last name
            </label>
            <input
              id="lastname"
              name="lastname"
              type="text"
              required
              value={form.lastname}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="username" className="text-sm font-bold">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            value={form.username}
            onChange={handleChange}
            aria-invalid={usernameError ? true : undefined}
            aria-describedby="username-help"
            className={inputClass}
          />
          <p
            id="username-help"
            className={`text-xs ${usernameError ? "text-destructive" : "text-muted-foreground"}`}
          >
            {usernameError ??
              "5 to 20 characters. Letters, numbers, dots and underscores."}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="phone" className="text-sm font-bold">
            Phone{" "}
            <span className="font-normal text-muted-foreground">optional</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-3 inline-flex items-center justify-center gap-2 rounded-md bg-accent px-6 py-3.5 font-bold text-accent-foreground transition-transform duration-150 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Setting up
            </>
          ) : (
            "Accept invite"
          )}
        </button>
      </form>
    </div>
  );
}

export default AdminOnboarding;
