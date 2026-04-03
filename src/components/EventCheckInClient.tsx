"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
