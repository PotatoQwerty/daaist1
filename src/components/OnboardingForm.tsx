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
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    username: "",
    studyyear: "",
    registration_number: "",
    isdaa: false,
  });
  const usernameRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // if (!session) router.replace("/");
    // if (onboarded === true && !loading) router.replace("/");
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [router]);
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Update the form state
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleIsDaaChange = (val: boolean) => {
    setForm((prev) => ({ ...prev, isdaa: val }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/onboarding", {
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
        throw new Error("Failed to submit onboarding data");
      }

      // only runs if everything was successful
      router.replace("/");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div
      className="w-full md:w-1/2 flex flex-col overflow-y-auto justify-center items-center px-10"
      ref={formRef}
    >
      <div className="w-full max-w-md space-y-6">
        <h2 className="text-3xl font-bold text-primary uppercase text-center">
          Student Sign Up
        </h2>
        <p className="text-gray-500 text-center text-xl">
          Complete your profile to start using DAA’ist
        </p>

        <form
          className="flex flex-col gap-4 bg-white p-5 rounded-lg"
          method="POST"
          onSubmit={handleSubmit}
        >
          <input
            onChange={handleChange}
            type="text"
            autoComplete="given-name"
            name="firstname"
            title="First Name"
            required
            minLength={4}
            maxLength={16}
            pattern="[a-zA-Z0-9]{4,16}"
            placeholder="First name"
            className="border border-gray-300 p-3 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-primary invalid:focus:ring-red-500 valid:focus:ring-green-500"
          />

          <input
            onChange={handleChange}
            type="text"
            name="lastname"
            autoComplete="family-name"
            required
            minLength={4}
            maxLength={16}
            pattern="[a-zA-Z0-9]{4,16}"
            title="Last Name"
            placeholder="Last name"
            className="border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-black invalid:focus:ring-red-500 valid:focus:ring-green-500 "
          />

          <input
            onChange={handleChange}
            type="text"
            name="username"
            title="username"
            pattern="[a-zA-Z0-9]{5,16}"
            required
            ref={usernameRef}
            placeholder="Username"
            className="border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-black invalid:focus:ring-red-500 valid:focus:ring-green-500"
          />

          <input
            onChange={handleChange}
            type="text"
            required
            maxLength={8}
            name="registration_number"
            pattern="[0-9]{8}"
            title="matricule"
            aria-label="Matricule"
            placeholder="Registration number"
            className="border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary gap-1 text-black invalid:focus:ring-red-500 valid:focus:ring-green-500"
          />

          <select
            title="Study-year-selection"
            name="studyyear"
            required
            id="studyyear"
            value={form.studyyear}
            onChange={handleChange}
            className="border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-black"
          >
            <option value="" disabled>
              Please select which year you study
            </option>
            <option value="L1">1st year (L1)</option>
            <option value="L2">2nd year (L2)</option>
            <option value="L3">3rd year (L3)</option>
            <option value="M1">4th year (M1)</option>
            <option value="M2">5th year (M2)</option>
          </select>

          <div className="flex flex-col gap-2 justify-center items-center">
            <span className="text-gray-600">Do you study in DAA?</span>
            <IsDaaSelector handleFormChanges={handleIsDaaChange} />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-primary flex gap-2 justify-center items-center text-white p-3 rounded-md hover:bg-blue-800 transition cursor-pointer disabled:bg-gray-400"
          >
            {submitting ? (
              <>
                <span>Submitting</span>
                <Loader2 className="size-5 animate-spin" />
              </>
            ) : (
              "Submit"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default OnboardingForm;
