"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Search, UserRoundCheck } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Participant = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  registration_number: string;
  checked_in_at?: string | null;
  check_in_method?: string | null;
};

type EventCheckInClientProps = {
  eventId: string;
  eventTitle: string;
  initialToken?: string;
};

type CheckInResponse = {
  message?: string;
  alreadyCheckedIn?: boolean;
  participant?: Participant;
  error?: string;
};

export default function EventCheckInClient({
  eventId,
  eventTitle,
  initialToken,
}: EventCheckInClientProps) {
  const [query, setQuery] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeParticipantId, setActiveParticipantId] = useState<string | null>(
    null,
  );
  const [autoCheckInState, setAutoCheckInState] = useState<{
    status: "idle" | "loading" | "success" | "error";
    message: string;
    participant?: Participant | null;
  }>({
    status: initialToken ? "loading" : "idle",
    message: initialToken ? "Verifying attendee pass..." : "",
    participant: null,
  });
  const handledTokenRef = useRef<string | null>(null);

  const fetchParticipants = useCallback(
    async (searchValue: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ event_id: eventId });
        if (searchValue.trim()) {
          params.set("q", searchValue.trim());
        }

        const response = await fetch(
          `/api/club/event/participants?${params.toString()}`,
          {
            cache: "no-store",
          },
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Unable to load participants");
        }

        setParticipants(result.data || []);
      } catch (error) {
        console.error(error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to load participants.",
        );
      } finally {
        setLoading(false);
      }
    },
    [eventId],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchParticipants(query);
    }, 250);

    return () => clearTimeout(timer);
  }, [fetchParticipants, query]);

  const runCheckIn = useCallback(
    async ({
      token,
      participantId,
      method,
    }: {
      token?: string;
      participantId?: string;
      method: "qr" | "manual";
    }) => {
      const response = await fetch("/api/club/event/check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId,
          token,
          participantId,
          method,
        }),
      });

      const result: CheckInResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to complete check-in.");
      }

      return result;
    },
    [eventId],
  );

  useEffect(() => {
    if (!initialToken || handledTokenRef.current === initialToken) {
      return;
    }

    handledTokenRef.current = initialToken;

    const autoCheckIn = async () => {
      try {
        setAutoCheckInState({
          status: "loading",
          message: "Verifying attendee pass...",
          participant: null,
        });

        const result = await runCheckIn({
          token: initialToken,
          method: "qr",
        });

        setAutoCheckInState({
          status: "success",
          message: result.message || "Participant checked in.",
          participant: result.participant || null,
        });
        toast.success(result.message || "Participant checked in.");
        fetchParticipants(query);
      } catch (error) {
        console.error(error);
        const message =
          error instanceof Error
            ? error.message
            : "Unable to complete QR check-in.";
        setAutoCheckInState({
          status: "error",
          message,
          participant: null,
        });
        toast.error(message);
      }
    };

    autoCheckIn();
  }, [fetchParticipants, initialToken, query, runCheckIn]);

  const handleManualCheckIn = async (participantId: string) => {
    try {
      setActiveParticipantId(participantId);
      const result = await runCheckIn({
        participantId,
        method: "manual",
      });

      toast.success(result.message || "Participant checked in.");
      fetchParticipants(query);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to complete manual check-in.",
      );
    } finally {
      setActiveParticipantId(null);
    }
  };

  return (
    <div className="space-y-6">
      {autoCheckInState.status !== "idle" && (
        <div
          className={`rounded-[1.5rem] border p-5 ${
            autoCheckInState.status === "success"
              ? "border-green-200 bg-green-50 text-green-900 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-100"
              : autoCheckInState.status === "error"
                ? "border-destructive/30 bg-destructive/10 text-foreground"
                : "border-border bg-muted/40"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-white/70 p-2 dark:bg-black/20">
              {autoCheckInState.status === "loading" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : autoCheckInState.status === "success" ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <UserRoundCheck className="h-5 w-5" />
              )}
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold">{eventTitle}</h2>
              <p className="text-sm leading-6">{autoCheckInState.message}</p>
              {autoCheckInState.participant && (
                <p className="text-sm font-medium">
                  {autoCheckInState.participant.first_name}{" "}
                  {autoCheckInState.participant.last_name} |{" "}
                  {autoCheckInState.participant.registration_number}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-[1.5rem] border border-border bg-card p-5">
        <div className="mb-4 space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Manual Fallback
          </p>
          <h3 className="text-2xl font-bold">Search registrations</h3>
          <p className="text-sm leading-6 text-muted-foreground">
            Search by name, email, phone, or registration number, then check the
            attendee in manually.
          </p>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search attendees..."
            className="h-12 rounded-xl pl-11"
          />
        </div>

        <div className="mt-5 space-y-3">
          {loading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/35 p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading participants...
            </div>
          ) : participants.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/25 p-6 text-center text-sm text-muted-foreground">
              No participants match your search yet.
            </div>
          ) : (
            participants.map((participant) => (
              <div
                key={participant.id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <p className="text-lg font-semibold">
                    {participant.first_name} {participant.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {participant.registration_number}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {participant.email} | {participant.phone}
                  </p>
                  {participant.checked_in_at && (
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">
                      Checked in{" "}
                      {new Date(participant.checked_in_at).toLocaleString()} via{" "}
                      {participant.check_in_method || "manual"}
                    </p>
                  )}
                </div>

                {participant.checked_in_at ? (
                  <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Checked in
                  </div>
                ) : (
                  <Button
                    type="button"
                    className="h-11 rounded-xl px-5"
                    onClick={() => handleManualCheckIn(participant.id)}
                    disabled={activeParticipantId === participant.id}
                  >
                    {activeParticipantId === participant.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Checking in...
                      </>
                    ) : (
                      "Check in attendee"
                    )}
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
