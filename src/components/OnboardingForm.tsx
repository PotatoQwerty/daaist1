"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import swal from "sweetalert2";
import { useUser } from "@/context/user-context";
import IsDaaSelector from "./IsDaaSelector";

function OnboardingForm() {
  const router = useRouter();
  const { session } = useUser();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [hidden, setHidden] = useState<boolean>(true);
  const [foundDaa, setFoundDaa] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [usernameConflict, setUsernameConflict] = useState<boolean>(false);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      const username = form.username;

      if (!username) {
        setError("");
        return;
      }

      const isValidUsername = (u: string) => {
        const regex = /^(?![._])(?!.*[._]$)(?!.*\.\.)[a-zA-Z0-9._]{5,20}$/;
        return regex.test(u);
      };

      if (username.startsWith(".")) {
        setError("Username cannot start with a dot");
      } else if (username.includes(" ")) {
        setError("Spaces are not allowed in usernames");
      } else if (!isValidUsername(username)) {
        setError(
          "Username must be 5-20 chars (only letters, numbers, dot, underscore)"
        );
      } else {
        setError("");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [form.username]);

  useEffect(() => {
    setUsernameConflict(false);
  }, [form.username]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleIsDaaChange = (val: boolean) => {
    setForm((prev) => ({ ...prev, isdaa: val }));

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

    const result = await swal.fire({
      title: "Are you sure you entered the correct matricule?",
      input: "text",
      inputLabel: "Your matricule",
      inputValue: form.registration_number.trim(),
      inputValidator: (value) => {
        if (!value) return "Matricule is required!";
        if (value.length > 15) return "Matricule must be at most 15 characters";
        return null;
      },
      showCancelButton: true,
    });

    if (!result.isConfirmed) return;

    const updatedMatricule = result.value;
    setForm((prevState) => ({
      ...prevState,
      registration_number: updatedMatricule.trim(),
    }));

    try {
      const res = await fetch(
        `/api/registration/check/${updatedMatricule.trim()}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (res.status === 404) {
        toast.error("Not a DAA student! Please check your registration number.");
        return;
      }

      if (!res.ok) {
        toast.error("Something went wrong. Please try again.");
        return;
      }

      const { data } = await res.json();

      toast.success("DAA student verified!");

      setForm((prev) => ({
        ...prev,
        firstname: data.firstname,
        lastname: data.lastname,
      }));

      setFoundDaa(true);
      setHidden(false);
    } catch (fetchError) {
      console.error("Error checking DAA student:", fetchError);
      toast.error("Server error while checking student.");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    if (error) {
      toast.error(error);
      setSubmitting(false);
      return;
    }

    if (usernameConflict) {
      toast.error("Username is already taken! Please choose another one.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/registration/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form, id: session?.user.id }),
      });

      if (res.status === 409) {
        setUsernameConflict(true);
        toast.error("Username is already taken! Please choose another one.");
        usernameRef.current?.focus();
        return;
      }

      if (!res.ok) {
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

  const inputClassName =
    "w-full rounded-xl border border-border bg-background/80 p-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring transition disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground";
  const readonlyInputClassName =
    "w-full rounded-xl border border-border bg-muted p-4 text-sm text-muted-foreground cursor-not-allowed";
  const buttonClassName =
    "w-full rounded-xl bg-primary p-4 text-base font-semibold text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90 transition active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background";

  const usernameMessage = usernameConflict
    ? "Username is already taken. Please choose another one."
    : error;

  return (
    <div ref={formRef} className="mx-auto w-full max-w-lg">
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Student Setup
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Complete your profile
          </h2>
          <p className="text-sm text-muted-foreground">
            Finish onboarding to start using Daa&apos;ist.
          </p>
        </div>

        <form
          aria-label="Sign up Form"
          className="space-y-6"
          method="POST"
          onSubmit={handleSubmit}
        >
          <div className="rounded-2xl border border-border bg-background/60 p-4">
            <div className="flex flex-col items-center gap-4 text-center">
              <span className="text-sm font-semibold text-foreground">
                Do you study in DAA?
              </span>
              <IsDaaSelector
                currentValue={form.isdaa}
                handleFormChanges={handleIsDaaChange}
              />
            </div>
          </div>

          {form.isdaa === true && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="space-y-3">
                <input
                  onChange={handleChange}
                  type="text"
                  required
                  disabled={foundDaa}
                  value={form.registration_number}
                  maxLength={15}
                  name="registration_number"
                  title="matricule"
                  placeholder="Registration number (e.g., 2121001234)"
                  className={inputClassName}
                />

                <button
                  onClick={handleCheckDaa}
                  disabled={foundDaa}
                  type="button"
                  className={`${buttonClassName} ${
                    foundDaa ? "hidden" : "block"
                  }`}
                >
                  Look me up!
                </button>
              </div>

              {!hidden && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      title="readOnlylastname"
                      readOnly
                      value={form.lastname}
                      className={readonlyInputClassName}
                    />
                    <input
                      readOnly
                      title="readOnlyfirstname"
                      value={form.firstname}
                      className={readonlyInputClassName}
                    />
                  </div>

                  <div className="space-y-2">
                    <input
                      onChange={handleChange}
                      type="text"
                      name="username"
                      value={form.username}
                      required
                      ref={usernameRef}
                      placeholder="Choose a username"
                      className={`${inputClassName} ${
                        usernameMessage
                          ? "border-destructive focus:ring-destructive"
                          : ""
                      }`}
                    />
                    {usernameMessage && (
                      <p className="text-sm text-destructive font-medium">
                        {usernameMessage}
                      </p>
                    )}
                  </div>

                  <select
                    title="study year select"
                    name="studyyear"
                    required
                    id="studyyearDaa"
                    value={form.studyyear}
                    onChange={handleChange}
                    className={inputClassName}
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
                    className={buttonClassName}
                  >
                    {submitting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Complete Setup"
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {form.isdaa === false && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  onChange={handleChange}
                  type="text"
                  name="lastname"
                  value={form.lastname}
                  required
                  placeholder="Last name"
                  className={inputClassName}
                />
                <input
                  onChange={handleChange}
                  type="text"
                  name="firstname"
                  value={form.firstname}
                  required
                  placeholder="First name"
                  className={inputClassName}
                />
              </div>

              <div className="space-y-2">
                <input
                  onChange={handleChange}
                  type="text"
                  name="username"
                  value={form.username}
                  required
                  ref={usernameRef}
                  placeholder="Username"
                  className={`${inputClassName} ${
                    usernameMessage
                      ? "border-destructive focus:ring-destructive"
                      : ""
                  }`}
                />
                {usernameMessage && (
                  <p className="text-sm text-destructive font-medium">
                    {usernameMessage}
                  </p>
                )}
              </div>

              <input
                onChange={handleChange}
                type="text"
                required
                value={form.registration_number}
                maxLength={15}
                name="registration_number"
                placeholder="Registration number (e.g., 2121001234)"
                className={inputClassName}
              />

              <select
                title="study year select"
                name="studyyear"
                id="studyyearNonDaa"
                required
                value={form.studyyear}
                onChange={handleChange}
                className={inputClassName}
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
                className={buttonClassName}
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

