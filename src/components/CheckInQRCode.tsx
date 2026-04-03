"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { Copy, QrCode } from "lucide-react";
import toast from "react-hot-toast";
import { getEventCheckInPath } from "@/lib/event-path";
import { Button } from "@/components/ui/button";

type CheckInQRCodeProps = {
  baseUrl: string;
  eventId: string;
  eventTitle: string;
  checkInToken: string;
};

export default function CheckInQRCode({
  baseUrl,
  eventId,
  eventTitle,
  checkInToken,
}: CheckInQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [qrReady, setQrReady] = useState(false);

  const checkInUrl = useMemo(() => {
    if (!baseUrl) return "";

    return new URL(
      getEventCheckInPath({ id: eventId, title: eventTitle }, checkInToken),
      baseUrl,
    ).toString();
  }, [baseUrl, checkInToken, eventId, eventTitle]);

  const shortToken = useMemo(() => checkInToken.slice(0, 8), [checkInToken]);

  useEffect(() => {
    let cancelled = false;

    const renderQrCode = async () => {
      if (!checkInUrl || !canvasRef.current) {
        setQrReady(false);
        return;
      }

      try {
        await QRCode.toCanvas(canvasRef.current, checkInUrl, {
          width: 220,
          margin: 1,
          color: {
            dark: "#0f172a",
            light: "#ffffff",
          },
        });

        if (!cancelled) {
          setQrReady(true);
        }
      } catch (error) {
        console.error("QR generation error:", error);
        if (!cancelled) {
          setQrReady(false);
        }
      }
    };

    renderQrCode();

    return () => {
      cancelled = true;
    };
  }, [checkInUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(checkInUrl);
      toast.success("Check-in link copied.");
    } catch (error) {
      console.error(error);
      toast.error("Unable to copy the check-in link.");
    }
  };

  return (
    <div className="rounded-[1.75rem] border border-border bg-card p-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Check-In Pass
          </p>
          <h3 className="text-xl font-bold">{eventTitle}</h3>
          <p className="text-sm leading-6 text-muted-foreground">
            Event organizers can scan this QR code at the door. If scanning is
            unavailable, they can also search for your registration manually.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-[240px_1fr] sm:items-center">
          <div className="flex min-h-[240px] items-center justify-center rounded-[1.5rem] bg-muted/40 p-3">
            {checkInUrl ? (
              <canvas
                ref={canvasRef}
                className={`rounded-xl bg-white p-3 ${
                  qrReady ? "block" : "hidden"
                }`}
              />
            ) : null}

            {!qrReady && (
              <div className="flex h-[220px] w-[220px] items-center justify-center rounded-xl bg-white text-primary">
                <QrCode className="h-10 w-10" />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-muted/35 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Pass reference
              </p>
              <p className="mt-2 text-lg font-semibold">#{shortToken}</p>
            </div>

            <div className="rounded-2xl border border-border bg-muted/35 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Backup link
              </p>
              <p className="mt-2 break-all text-sm leading-6 text-muted-foreground">
                {checkInUrl || "Preparing your check-in link..."}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl px-5"
              onClick={handleCopy}
              disabled={!checkInUrl}
            >
              <Copy className="h-4 w-4" />
              Copy check-in link
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
