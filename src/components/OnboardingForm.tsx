"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import IsDaaSelector from "./IsDaaSelector";
import { useSession } from "next-auth/react";

function OnboardingForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [hidden, setHidden] = useState<boolean>(true);
  const [foundDaa, setFoundDaa] = useState<boolean>(false);

  // FIX 1: Initialize isdaa as null explicitly
  const [form, setForm] = useState<{
    firstname: string;
    lastname: string;
    username: string;
    studyyear: string;
    registration_number: string;
    isdaa: boolean | null;
  }>({
    firstname: "",
    lastname: "",
    username: "",
    studyyear: "",
    registration_number: "",
    isdaa: null,
  });

  const usernameRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleIsDaaChange = (val: boolean) => {
    setForm((prev) => ({ ...prev, isdaa: val }));
    // Optional: Reset found state if they switch back and forth
    if (!val) {
      setFoundDaa(false);
      setHidden(true);
    }
  };

  const handleCheckDaa = async () => {
    if (!form.registration_number) {
      toast.error("Registration number is required");
      return;
    }
    try {
      const res = await fetch(
        `api/registration/check/${form.registration_number}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (res.status === 404) {
        toast.error(
          "Not a DAA student! Please check your registration number."
        );
        return;
      }

      toast.success("DAA student verified!");
      const { data } = await res.json();

      setForm((prev) => ({
        ...prev,
        firstname: data.firstname,
        lastname: data.lastname,
      }));
      setFoundDaa(true);
      setHidden(false);
    } catch (error) {
      console.error("Error checking DAA student:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/registration/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form, id: session?.user.id }),
      });

      if (res.status === 409) {
        toast.error("Username is already taken! Please choose another one.");
        usernameRef.current?.focus();
        usernameRef.current?.classList.add("bg-red-100");
        return;
      }

      if (!res.ok) {
        console.log(res);
        throw new Error("Failed to submit onboarding data");
      }

      router.replace("/");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="w-full flex flex-col justify-center items-center px-6 md:px-12 py-10"
      ref={formRef}
    >
      <div className="w-full max-w-lg space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-4xl font-extrabold text-primary uppercase tracking-tight">
            Student Sign Up
          </h2>
          <p className="text-gray-300 text-lg">
            Complete your profile to start using DAA’ist
          </p>
        </div>

        <form
          aria-label="Sign up Form"
          className="flex flex-col gap-6" // Increased gap
          method="POST"
          onSubmit={handleSubmit}
        >
          {/* Question Section */}
          <div className="flex flex-col gap-4 justify-center items-center py-2">
            <span className="text-gray-700 font-medium text-lg">
              Do you study in DAA?
            </span>
            <IsDaaSelector
              currentValue={form.isdaa}
              handleFormChanges={handleIsDaaChange}
            />
          </div>

          {/* ----- OPTION A: YES (DAA Student) ----- */}
          {form.isdaa === true && (
            <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <input
                onChange={handleChange}
                type="text"
                required
                disabled={foundDaa}
                value={form.registration_number}
                name="registration_number"
                title="matricule"
                placeholder="Registration number (e.g., 2121001234)"
                className="w-full border border-gray-300 p-4 rounded-xl focus:outline-none text-gray-700 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:bg-gray-200 disabled:cursor-not-allowed placeholder:text-gray-400"
              />

              <button
                onClick={handleCheckDaa}
                disabled={foundDaa}
                type="button"
                className={`bg-primary text-white rounded-xl p-4 font-bold text-lg hover:bg-blue-800 transition shadow-lg shadow-blue-500/20 active:scale-[0.98] w-full ${
                  foundDaa ? "hidden" : "block"
                }`}
              >
                Look me up!
              </button>

              {/* Show the rest only if found */}
              {!hidden && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      title="readOnlylastname"
                      readOnly
                      value={form.lastname}
                      className="border border-gray-200 bg-gray-200 p-4 rounded-xl text-gray-700 font-medium cursor-not-allowed "
                    />
                    <input
                      readOnly
                      title="readOnlyfirstname"
                      value={form.firstname}
                      className="border border-gray-200 bg-gray-200 p-4 rounded-xl text-gray-700 font-medium cursor-not-allowed"
                    />
                  </div>

                  <input
                    onChange={handleChange}
                    type="text"
                    name="username"
                    value={form.username}
                    required
                    ref={usernameRef}
                    placeholder="Choose a Username"
                    className="w-full border border-gray-300 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50  placeholder:text-gray-400"
                  />

                  <select
                    title="study year select"
                    name="studyyear"
                    required
                    id="studyyearDaa"
                    value={form.studyyear}
                    onChange={handleChange}
                    className="w-full border border-border bg-background text-foreground p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  >
                    <option value="" disabled>
                      Select Study Year
                    </option>
                    <option value="L1">L1</option>
                    <option value="L2">L2</option>
                    <option value="L3">L3</option>
                    <option value="M1">M1</option>
                    <option value="M2">M2</option>
                  </select>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-primary mt-2 flex gap-2 justify-center items-center text-white p-4 rounded-xl font-bold text-lg hover:bg-blue-800 transition shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                  >
                    {submitting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Complete Setup"
                    )}
                  </button>
                </>
              )}
            </div>
          )}

          {/* ----- OPTION B: NO (Non-DAA Student) ----- */}
          {form.isdaa === false && (
            <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <input
                  onChange={handleChange}
                  type="text"
                  name="lastname"
                  value={form.lastname}
                  required
                  placeholder="Last name"
                  className="w-full border border-gray-300 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50  placeholder:text-gray-400"
                />
                <input
                  onChange={handleChange}
                  type="text"
                  name="firstname"
                  value={form.firstname}
                  required
                  placeholder="First name"
                  className="w-full border border-gray-300 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50  placeholder:text-gray-400"
                />
              </div>

              <input
                onChange={handleChange}
                type="text"
                name="username"
                value={form.username}
                required
                placeholder="Username"
                className="w-full border border-gray-300 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50  placeholder:text-gray-400"
              />

              <input
                onChange={handleChange}
                type="text"
                required
                value={form.registration_number}
                name="registration_number"
                placeholder="Registration number (e.g., 2121001234)"
                className="w-full border border-gray-300 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50  placeholder:text-gray-400"
              />

              <select
                title="study year select"
                name="studyyear"
                id="studyyearNonDaa"
                required
                value={form.studyyear}
                onChange={handleChange}
                className="w-full border border-border bg-background text-foreground p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              >
                <option value="" disabled>
                  Select Study Year
                </option>
                <option value="L1">L1</option>
                <option value="L2">L2</option>
                <option value="L3">L3</option>
                <option value="M1">M1</option>
                <option value="M2">M2</option>
              </select>

              <button
                type="submit"
                disabled={submitting}
                className="bg-primary mt-4 flex gap-2 justify-center items-center text-white p-4 rounded-xl font-bold text-lg hover:bg-blue-800 transition shadow-lg shadow-blue-500/20 active:scale-[0.98]"
              >
                {submitting ? <Loader2 className="animate-spin" /> : "Sign Up"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default OnboardingForm;
