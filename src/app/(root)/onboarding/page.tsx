"use client";
import React, { useState, useEffect } from "react";
import IsDaaSelector from "@/components/IsDaaSelector";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useIsOnBoarded } from "@/hooks/use-is-onboarded";
import MessageCard from "@/components/MessageCard";

export default function Onboarding() {
  const { loading, onboarded } = useIsOnBoarded();
  const { data: session } = useSession();
  const router = useRouter();

  const [error, setError] = useState({
    usererr: "",
    fnameerr: "",
    lnameerr: "",
    matriculeerr: "",
  });
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    username: "",
    studyyear: "",
    registration_number: "",
    isDaa: false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Update the form state
    setForm((prev) => ({ ...prev, [name]: value }));

    let errorMsg = "";

    // Validation rules
    if (name === "username") {
      if (value.length < 5 || value.length > 15) {
        errorMsg = "Username should be between 5 and 15 characters.";
      }
    } else if (name === "fname" || name === "lname") {
      if (value.length < 4 || value.length > 15) {
        errorMsg = `${
          name === "fname" ? "First" : "Last"
        } should be between 5 and 15 characters.`;
      }
    } else if (name === "matricule") {
      if (!/^[0-9]+$/.test(value)) {
        errorMsg = "Matricule should contain only numbers.";
      }
    }

    // Map input name → error key
    const errorKey = {
      username: "usererr",
      fname: "fnameerr",
      lname: "lnameerr",
      matricule: "matriculeerr",
    }[name] as keyof typeof error;

    // Update only that specific error
    setError((prev) => ({ ...prev, [errorKey]: errorMsg }));
  };
  const visibleError = Object.values(error).find((msg) => msg !== "");

  const handleIsDaaChange = (val: boolean) => {
    setForm((prev) => ({ ...prev, isDaa: val }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form, id: session?.user.id }),
      });

      if (!res.ok) throw new Error("Failed to submit onboarding data");
      else if (res.ok) {
        router.replace("/");
      }
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    if (!session && !loading) router.replace("/");
    if (onboarded === true && !loading) router.replace("/");
  }, [session, onboarded, loading, router]);
  return (
    <div className="flex min-h-screen">
      {/* Left Section */}
      <div className="w-1/2 justify-center items-center hidden md:flex relative overflow-hidden">
        {/* Abstract Bauhaus shapes */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-400 rounded-full"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-primary "></div>
        <div className="absolute bottom-20 left-10 w-40 h-40 bg-primary "></div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 h-6 bg-white"></div>

        <h1 className="text-white text-5xl font-bold z-10">DAA’ist</h1>
        {/* the loading component is causing a problem when its hidden for smaller screens  */}
        {/* <Loading /> */}
      </div>

      {/* Right Section */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-10">
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
              name="firstname"
              title="First Name"
              required
              minLength={4}
              maxLength={16}
              pattern="[a-zA-Z0-9]{4,16}"
              placeholder="First name"
              className="border border-gray-300 p-3 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              onChange={handleChange}
              type="text"
              name="lastname"
              required
              minLength={4}
              maxLength={16}
              pattern="[a-zA-Z0-9]{4,16}"
              title="Last Name"
              placeholder="Last name"
              className="border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-black "
            />
            <input
              onChange={handleChange}
              type="text"
              name="username"
              title="username"
              pattern="[a-zA-Z0-9]{5,16}"
              required
              placeholder="Username"
              className="border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-black"
            />

            <input
              onChange={handleChange}
              type="string"
              required
              maxLength={8}
              name="registration_number"
              placeholder="Registration number"
              className="border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary gap-1 text-black"
            />

            <select
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

            <div className="flex justify-center items-center">
              <span className="text-gray-600">Do you study in DAA?</span>
              <IsDaaSelector handleFormChanges={handleIsDaaChange} />
            </div>
            {visibleError && (
              <MessageCard message={visibleError} type="error" />
            )}

            <button
              type="submit"
              className="bg-primary text-white p-3 rounded-md hover:bg-blue-800 transition"
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
