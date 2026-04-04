"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import jsQR from "jsqr";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  Loader2,
  ScanLine,
  Search,
  UserRoundCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Participant = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  university?: string | null;
  study_year?: string | null;
  registration_number: string;
  created_at?: string | null;
  attendance_role?: string | null;
  attendance_role_label?: string | null;
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

function extractCheckInToken(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const token = parsed.searchParams.get("token");
    if (token) {
      return token.trim();
    }
  } catch {
    // Keep parsing below for raw token strings.
  }

  const queryMatch = trimmed.match(/[?&]token=([^&]+)/i);
  if (queryMatch?.[1]) {
    return decodeURIComponent(queryMatch[1]);
  }

  return /^[0-9a-f-]{36}$/i.test(trimmed) ? trimmed : null;
}

export default function EventCheckInClient({
  eventId,
  eventTitle,
  initialToken,
}: EventCheckInClientProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "checked_in">(
    "all",
  );
  const [roleFilter, setRoleFilter] = useState<"all" | "participant" | "invited_only">(
    "all",
  );
  const [studyYearFilter, setStudyYearFilter] = useState("all");
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
  const [scannerEnabled, setScannerEnabled] = useState(false);
  const [scannerStatus, setScannerStatus] = useState<
    "idle" | "starting" | "active" | "error" | "unsupported"
  >("idle");
  const [scannerMessage, setScannerMessage] = useState(
    "Open the camera once, then keep scanning attendee passes from this page.",
  );
  const handledTokenRef = useRef<string | null>(null);
  const scannerStatusRef = useRef(scannerStatus);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const processingScanRef = useRef(false);
  const lastScannedTokenRef = useRef<string | null>(null);
  const lastScannedAtRef = useRef(0);
  const selectClassName =
    "h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:border-ring focus:ring-[3px] focus:ring-ring/50";

  const stopScanner = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    scannerStatusRef.current = scannerStatus;
  }, [scannerStatus]);

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
      method: "qr" | "manual" | "scanner";
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

  const applyCheckInResult = useCallback(
    (result: CheckInResponse, fallbackMessage: string) => {
      setAutoCheckInState({
        status: "success",
        message: result.message || fallbackMessage,
        participant: result.participant || null,
      });
      return result.message || fallbackMessage;
    },
    [],
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

        toast.success(applyCheckInResult(result, "Participant checked in."));
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
  }, [applyCheckInResult, fetchParticipants, initialToken, query, runCheckIn]);

  useEffect(() => {
    if (!scannerEnabled) {
      stopScanner();
      if (scannerStatusRef.current !== "unsupported") {
        setScannerStatus("idle");
        setScannerMessage(
          "Open the camera once, then keep scanning attendee passes from this page.",
        );
      }
      return;
    }

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setScannerStatus("unsupported");
      setScannerMessage("This browser does not support camera scanning.");
      setScannerEnabled(false);
      return;
    }

    let cancelled = false;

    const processToken = async (token: string) => {
      const now = Date.now();
      if (
        processingScanRef.current ||
        (lastScannedTokenRef.current === token && now - lastScannedAtRef.current < 4000)
      ) {
        return;
      }

      processingScanRef.current = true;
      lastScannedTokenRef.current = token;
      lastScannedAtRef.current = now;

      setAutoCheckInState({
        status: "loading",
        message: "Checking in scanned attendee...",
        participant: null,
      });

      try {
        const result = await runCheckIn({
          token,
          method: "scanner",
        });

        const message = applyCheckInResult(
          result,
          "Participant checked in successfully.",
        );
        toast.success(message);
        setScannerMessage("Scan complete. Ready for the next attendee.");
        fetchParticipants(query);
      } catch (error) {
        console.error(error);
        const message =
          error instanceof Error
            ? error.message
            : "Unable to complete scanned check-in.";
        setAutoCheckInState({
          status: "error",
          message,
          participant: null,
        });
        setScannerMessage(message);
        toast.error(message);
      } finally {
        processingScanRef.current = false;
      }
    };

    const scanFrame = () => {
      if (
        cancelled ||
        !videoRef.current ||
        !canvasRef.current ||
        videoRef.current.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA
      ) {
        frameRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext("2d", { willReadFrequently: true });

      if (!context) {
        frameRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      const token = code?.data ? extractCheckInToken(code.data) : null;

      if (token) {
        void processToken(token);
      }

      frameRef.current = requestAnimationFrame(scanFrame);
    };

    const startScanner = async () => {
      try {
        setScannerStatus("starting");
        setScannerMessage("Starting camera...");

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
          },
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          await videoRef.current.play();
        }

        setScannerStatus("active");
        setScannerMessage("Camera is live. Keep showing attendee QR codes.");
        frameRef.current = requestAnimationFrame(scanFrame);
      } catch (error) {
        console.error(error);
        setScannerStatus("error");
        setScannerMessage(
          error instanceof Error
            ? error.message
            : "Unable to access the camera for scanning.",
        );
        setScannerEnabled(false);
      }
    };

    void startScanner();

    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [
    applyCheckInResult,
    fetchParticipants,
    query,
    runCheckIn,
    scannerEnabled,
    stopScanner,
  ]);

  const handleManualCheckIn = async (participantId: string) => {
    try {
      setActiveParticipantId(participantId);
      const result = await runCheckIn({
        participantId,
        method: "manual",
      });

      toast.success(applyCheckInResult(result, "Participant checked in."));
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

  const availableStudyYears = useMemo(() => {
    return Array.from(
      new Set(
        participants
          .map((participant) => participant.study_year?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    );
  }, [participants]);

  const participantStats = useMemo(() => {
    return participants.reduce(
      (accumulator, participant) => {
        accumulator.total += 1;

        if (participant.checked_in_at) {
          accumulator.checkedIn += 1;
        } else {
          accumulator.pending += 1;
        }

        if (participant.attendance_role === "invited_only") {
          accumulator.invitedOnly += 1;
        }

        return accumulator;
      },
      { total: 0, checkedIn: 0, pending: 0, invitedOnly: 0 },
    );
  }, [participants]);

  const filteredParticipants = useMemo(() => {
    return participants.filter((participant) => {
      if (statusFilter === "checked_in" && !participant.checked_in_at) {
        return false;
      }

      if (statusFilter === "pending" && participant.checked_in_at) {
        return false;
      }

      if (roleFilter !== "all" && participant.attendance_role !== roleFilter) {
        return false;
      }

      if (
        studyYearFilter !== "all" &&
        (participant.study_year?.trim() || "") !== studyYearFilter
      ) {
        return false;
      }

      return true;
    });
  }, [participants, roleFilter, statusFilter, studyYearFilter]);

  const autoCheckInParticipantDetails = autoCheckInState.participant
    ? [
        autoCheckInState.participant.attendance_role_label,
        autoCheckInState.participant.study_year,
        autoCheckInState.participant.university,
      ]
        .filter(Boolean)
        .join(" | ")
    : "";

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
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {autoCheckInState.participant.first_name}{" "}
                    {autoCheckInState.participant.last_name} |{" "}
                    {autoCheckInState.participant.registration_number}
                  </p>
                  {autoCheckInParticipantDetails ? (
                    <p className="text-sm text-muted-foreground">
                      {autoCheckInParticipantDetails}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-[1.5rem] border border-border bg-card p-5">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
              Live Scanner
            </p>
            <h3 className="text-2xl font-bold">Check in with one camera view</h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Keep this page open and scan attendee QR codes one after another.
              The desk stays on this screen and refreshes the participant list
              after each scan.
            </p>
          </div>

          <Button
            type="button"
            variant={scannerEnabled ? "outline" : "default"}
            className="h-11 rounded-xl px-5"
            onClick={() => setScannerEnabled((prev) => !prev)}
          >
            {scannerEnabled ? (
              <>
                <CameraOff className="h-4 w-4" />
                Stop camera
              </>
            ) : (
              <>
                <Camera className="h-4 w-4" />
                Start scanner
              </>
            )}
          </Button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-[1.5rem] border border-border bg-muted/25">
            <div className="relative aspect-video overflow-hidden bg-black">
              <video
                ref={videoRef}
                muted
                playsInline
                className={`h-full w-full object-cover ${
                  scannerStatus === "active" || scannerStatus === "starting"
                    ? "block"
                    : "hidden"
                }`}
              />
              <canvas ref={canvasRef} className="hidden" />

              {scannerStatus !== "active" && scannerStatus !== "starting" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-white">
                  <ScanLine className="h-10 w-10" />
                  <p className="max-w-sm text-sm leading-6 text-white/85">
                    {scannerEnabled
                      ? scannerMessage
                      : "Start the camera to scan attendee QR codes continuously from this page."}
                  </p>
                </div>
              )}

              {(scannerStatus === "active" || scannerStatus === "starting") && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-48 w-48 rounded-[2rem] border-2 border-white/80 shadow-[0_0_0_9999px_rgba(15,23,42,0.15)]" />
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-border bg-background p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Scanner status
            </p>
            <p className="mt-3 text-lg font-semibold">
              {scannerStatus === "active"
                ? "Camera live"
                : scannerStatus === "starting"
                  ? "Starting..."
                  : scannerStatus === "unsupported"
                    ? "Not supported"
                    : scannerStatus === "error"
                      ? "Camera error"
                      : "Idle"}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {scannerMessage}
            </p>

            <div className="mt-5 rounded-2xl border border-border bg-muted/35 p-4 text-sm leading-6 text-muted-foreground">
              The camera keeps scanning while this page stays open. If the same
              QR code remains in view, the desk waits briefly before reading it
              again so attendees are not checked in twice by accident.
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-border bg-card p-5">
        <div className="mb-4 space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Manual Fallback
          </p>
          <h3 className="text-2xl font-bold">Search registrations</h3>
          <p className="text-sm leading-6 text-muted-foreground">
            Search by name, email, phone, university, study year, or
            registration number, then narrow the list with quick filters.
          </p>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Loaded
            </p>
            <p className="mt-2 text-2xl font-bold">{participantStats.total}</p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Pending
            </p>
            <p className="mt-2 text-2xl font-bold">{participantStats.pending}</p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Checked In
            </p>
            <p className="mt-2 text-2xl font-bold">{participantStats.checkedIn}</p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Invited Only
            </p>
            <p className="mt-2 text-2xl font-bold">
              {participantStats.invitedOnly}
            </p>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr),180px,180px,180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, phone, university, year, or registration number..."
              className="h-12 rounded-xl pl-11"
            />
          </div>

          <select
            title="Filter by status"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as "all" | "pending" | "checked_in",
              )
            }
            className={selectClassName}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="checked_in">Checked in</option>
          </select>

          <select
            title="Filter by attendance role"
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(
                event.target.value as "all" | "participant" | "invited_only",
              )
            }
            className={selectClassName}
          >
            <option value="all">All roles</option>
            <option value="participant">Participants</option>
            <option value="invited_only">Invited only</option>
          </select>

          <select
            title="Filter by study year"
            value={studyYearFilter}
            onChange={(event) => setStudyYearFilter(event.target.value)}
            className={selectClassName}
          >
            <option value="all">All years</option>
            {availableStudyYears.map((studyYear) => (
              <option key={studyYear} value={studyYear}>
                {studyYear}
              </option>
            ))}
          </select>
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
          ) : filteredParticipants.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/25 p-6 text-center text-sm text-muted-foreground">
              No loaded participants match the current filters.
            </div>
          ) : (
            filteredParticipants.map((participant) => (
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
                  <div className="flex flex-wrap gap-2 pt-1 text-xs">
                    {participant.attendance_role_label ? (
                      <span className="rounded-full border border-border bg-muted/45 px-3 py-1 text-muted-foreground">
                        {participant.attendance_role_label}
                      </span>
                    ) : null}
                    {participant.study_year ? (
                      <span className="rounded-full border border-border bg-muted/45 px-3 py-1 text-muted-foreground">
                        {participant.study_year}
                      </span>
                    ) : null}
                    {!participant.checked_in_at ? (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
                        Pending
                      </span>
                    ) : null}
                  </div>
                  {participant.university && (
                    <p className="text-sm text-muted-foreground">
                      {participant.university}
                    </p>
                  )}
                  {participant.created_at && (
                    <p className="text-sm text-muted-foreground">
                      Registered {new Date(participant.created_at).toLocaleString()}
                    </p>
                  )}
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
