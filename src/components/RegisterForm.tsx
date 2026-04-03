"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Loader2,
  MapPin,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import bannerFallback from "../../public/images/banner.jpg";
import { useUser } from "@/context/user-context";
import { formatEventDateRange } from "@/lib/event-date";
import { getRegisterEventPath } from "@/lib/event-path";
import CheckInQRCode from "./CheckInQRCode";
import SignInButton from "./SignInButton";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type RegisterFormEvent = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  cover_image?: string | null;
};

type RegisterFormProps = {
  baseUrl: string;
  event: RegisterFormEvent;
};

type RegistrationResponse = {
  message?: string;
  error?: string;
  checkInToken?: string;
  alreadyRegistered?: boolean;
};

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  university: string;
  studyYear: string;
  registrationNumber: string;
};

const YEAR_OPTIONS = ["L1", "L2", "L3", "M1", "M2", "Other"];

function RegisterForm({ baseUrl, event }: RegisterFormProps) {
  const { session, user } = useUser();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [checkInToken, setCheckInToken] = useState("");
  const [submissionMessage, setSubmissionMessage] = useState(
    "Your details have been saved.",
  );
  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    university: "",
    studyYear: "",
    registrationNumber: "",
  });

  const eventDate = useMemo(
    () => formatEventDateRange(event.start_date, event.end_date),
    [event.end_date, event.start_date],
  );
  const isSignedIn = Boolean(session?.user?.id);

  useEffect(() => {
    const metadata = session?.user?.user_metadata ?? {};

    setForm((prev) => ({
      firstName: prev.firstName || user?.firstname || metadata.first_name || "",
      lastName: prev.lastName || user?.lastname || metadata.last_name || "",
      email: prev.email || user?.email || session?.user?.email || "",
      phone: prev.phone || user?.phone || "",
      university:
        prev.university ||
        user?.university ||
        (user?.isdaa ? "Departement d'Architecture d'Alger" : ""),
      studyYear: prev.studyYear || user?.studyyear || "",
      registrationNumber:
        prev.registrationNumber || user?.registration_number || "",
    }));
  }, [session?.user?.email, session?.user?.user_metadata, user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/events/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: event.id,
          ...form,
        }),
      });

      const result: RegistrationResponse = await response.json();

      if (response.status === 409 && result.alreadyRegistered) {
        setCheckInToken(result.checkInToken || "");
        setSubmissionMessage(
          result.message || "You are already registered for this event.",
        );
        setSubmitted(true);
        toast.success(result.message || "You are already registered.");
        return;
      }

      if (!response.ok) {
        throw new Error(result.error || "Unable to submit registration");
      }

      setCheckInToken(result.checkInToken || "");
      setSubmissionMessage(result.message || "Your details have been saved.");
      toast.success(result.message || "Your registration has been received.");
      setSubmitted(true);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong while submitting.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputClassName =
    "h-12 rounded-xl border-border bg-background/80 px-4 text-base md:text-sm";
  const selectClassName =
    "h-12 w-full rounded-xl border border-border bg-background/80 px-4 text-base outline-none transition focus:border-ring focus:ring-[3px] focus:ring-ring/50 md:text-sm";

  return (
    <section className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <Link
          href="/register"
          className="inline-flex items-center gap-2 self-start rounded-full border border-border bg-background/70 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-accent hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to events
        </Link>

        <div className="overflow-hidden rounded-4xl border border-border bg-card shadow-[0_20px_80px_-40px_rgba(10,25,47,0.45)]">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative min-h-[360px] overflow-hidden">
              <Image
                src={event.cover_image || bannerFallback}
                alt={`${event.title} banner`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-br from-primary/95 via-primary/80 to-accent/70" />
              <div className="absolute -left-12 top-8 h-32 w-32 rounded-full border border-white/30 bg-secondary/70 blur-sm" />
              <div className="absolute bottom-6 right-6 h-28 w-28 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-sm" />

              <div className="relative flex h-full flex-col justify-between p-6 text-primary-foreground sm:p-8">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.35em]">
                    Event Registration
                  </span>
                  {isSignedIn && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-xs font-semibold">
                      <UserRoundCheck className="h-4 w-4" />
                      Autofill enabled
                    </span>
                  )}
                </div>

                <div className="max-w-xl space-y-5">
                  <div className="space-y-3">
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                      {event.title}
                    </h1>
                    <p className="max-w-2xl text-sm leading-6 text-primary-foreground/85 sm:text-base">
                      {event.description?.trim() ||
                        "Reserve your place with a quick registration form designed to match the event and save time for signed-in members."}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                      <div className="mb-2 inline-flex rounded-full bg-white/15 p-2">
                        <CalendarDays className="h-4 w-4" />
                      </div>
                      <p className="text-xs uppercase tracking-[0.25em] text-primary-foreground/70">
                        Schedule
                      </p>
                      <p className="mt-2 text-sm font-semibold leading-6">
                        {eventDate}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                      <div className="mb-2 inline-flex rounded-full bg-white/15 p-2">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <p className="text-xs uppercase tracking-[0.25em] text-primary-foreground/70">
                        Location
                      </p>
                      <p className="mt-2 text-sm font-semibold leading-6">
                        {event.location?.trim() || "Location to be announced"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-background p-6 sm:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                    Registration Form
                  </p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight">
                    Save your spot
                  </h2>
                </div>
                <div className="rounded-2xl bg-secondary px-4 py-3 text-secondary-foreground">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>

              <div className="mb-6 rounded-2xl border border-border bg-muted/50 p-4">
                {isSignedIn ? (
                  <p className="text-sm text-muted-foreground">
                    Available profile details were auto-filled for you. You can
                    still edit anything before submitting.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      Sign in to auto-fill your saved student details.
                    </p>
                    <SignInButton
                      redirectTo={getRegisterEventPath(event)}
                      className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                    >
                      Sign in
                    </SignInButton>
                  </div>
                )}
              </div>

              {submitted ? (
                <div className="space-y-5">
                  <div className="space-y-4 rounded-[1.75rem] border border-border bg-card p-6">
                    <div className="inline-flex rounded-full bg-secondary/25 p-3 text-secondary-foreground">
                      <UserRoundCheck className="h-6 w-6" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold">
                        Registration ready
                      </h3>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {submissionMessage} Keep this pass handy so organizers
                        can scan your QR code or look you up manually at
                        check-in.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 rounded-xl px-5"
                      onClick={() => setSubmitted(false)}
                    >
                      Update my details
                    </Button>
                  </div>

                  {checkInToken && (
                    <CheckInQRCode
                      baseUrl={baseUrl}
                      eventId={event.id}
                      eventTitle={event.title}
                      checkInToken={checkInToken}
                    />
                  )}
                </div>
              ) : (
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        required
                        value={form.firstName}
                        onChange={handleChange}
                        placeholder="Your first name"
                        className={inputClassName}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        required
                        value={form.lastName}
                        onChange={handleChange}
                        placeholder="Your last name"
                        className={inputClassName}
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        className={inputClassName}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="+213..."
                        className={inputClassName}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="university">University</Label>
                    <Input
                      id="university"
                      name="university"
                      required
                      value={form.university}
                      onChange={handleChange}
                      placeholder="Your university or school"
                      className={inputClassName}
                    />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="studyYear">Year</Label>
                      <select
                        title="Study year"
                        id="studyYear"
                        name="studyYear"
                        required
                        value={form.studyYear}
                        onChange={handleChange}
                        className={selectClassName}
                      >
                        <option value="" disabled>
                          Select your year
                        </option>
                        {YEAR_OPTIONS.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="registrationNumber">
                        Registration number
                      </Label>
                      <Input
                        id="registrationNumber"
                        name="registrationNumber"
                        required
                        maxLength={20}
                        value={form.registrationNumber}
                        onChange={handleChange}
                        placeholder="e.g. 2121001234"
                        className={inputClassName}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/40 p-4">
                    <p className="text-sm leading-6 text-muted-foreground">
                      This form is reusable for any public event. The event
                      banner, schedule, and submit target update automatically
                      from the route, while signed-in members get autofill from
                      their saved profile.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="h-12 w-full rounded-xl bg-accent text-base font-semibold text-accent-foreground shadow-lg shadow-accent/20 transition hover:bg-accent/90"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Complete registration"
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default RegisterForm;
