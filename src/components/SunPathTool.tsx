"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

const LONG_WAIT_MS = 30000;
const COLD_START_SOUND = "/sounds/coldstart.mp3";
const DEFAULT_TZ = "Africa/Algiers";
const CURRENT_YEAR = new Date().getFullYear();
const MIN_ALLOWED_YEAR = 1900;
const MAX_ALLOWED_YEAR = CURRENT_YEAR - 1;

type FileType = "png" | "svg";
type SunPathVariant = "2d" | "3d";

type SunPathToolProps = {
  variant: SunPathVariant;
};

function parseDMS(input: string): { lat: number | null; lon: number | null } {
  const regex = /(\d+)\u00B0(\d+)'([\d.]+)"([NSEW])/gi;
  const matches = [...input.matchAll(regex)];

  let lat: number | null = null;
  let lon: number | null = null;

  for (const match of matches) {
    const degrees = Number(match[1]);
    const minutes = Number(match[2]);
    const seconds = Number(match[3]);
    const direction = match[4].toUpperCase();

    let decimal = degrees + minutes / 60 + seconds / 3600;
    if (direction === "S" || direction === "W") {
      decimal *= -1;
    }

    if (direction === "N" || direction === "S") {
      lat = Number(decimal.toFixed(6));
    } else {
      lon = Number(decimal.toFixed(6));
    }
  }

  return { lat, lon };
}

async function getErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = (await response.json()) as {
      error?: string;
      details?: string;
      body?: string;
    };
    return data.error || data.details || data.body || "Request failed";
  }

  const text = await response.text();
  return text || "Request failed";
}

function SunPathTool({ variant }: SunPathToolProps) {
  const endpoint =
    variant === "2d" ? "/api/tools/sunpath2d" : "/api/tools/sunpath3d";
  const title =
    variant === "2d" ? "2D Sun Path Generator" : "3D Sun Path Generator";

  const [location, setLocation] = useState("");
  const tz = DEFAULT_TZ;
  const [year, setYear] = useState<number>(MAX_ALLOWED_YEAR);
  const [fileType, setFileType] = useState<FileType>("png");
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [generatedType, setGeneratedType] = useState<FileType>("png");
  const [loading, setLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isLongWait, setIsLongWait] = useState(false);

  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!loading) {
      setElapsedSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (imgPreview) {
        URL.revokeObjectURL(imgPreview);
      }
    };
  }, [imgPreview]);

  const clearLoadingTimer = () => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    setIsLongWait(false);
  };

  const startLoadingTimer = () => {
    clearLoadingTimer();
    loadingTimeoutRef.current = setTimeout(() => {
      setIsLongWait(true);
      if (!audioRef.current) {
        audioRef.current = new Audio(COLD_START_SOUND);
      }
      audioRef.current.currentTime = 0;
      void audioRef.current.play().catch(() => {
        toast("Still generating... this is taking longer than usual.");
      });
    }, LONG_WAIT_MS);
  };

  const handleYearChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = Number(event.target.value);
    if (!Number.isFinite(parsed)) return;

    const clamped = Math.min(
      MAX_ALLOWED_YEAR,
      Math.max(MIN_ALLOWED_YEAR, Math.trunc(parsed)),
    );
    setYear(clamped);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setIsLongWait(false);
    setImgPreview((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });

    const { lat, lon } = parseDMS(location);

    try {
      if (lat == null || lon == null) {
        throw new Error("Invalid coordinates format");
      }

      if (year < MIN_ALLOWED_YEAR || year > MAX_ALLOWED_YEAR) {
        throw new Error(
          `Year must be between ${MIN_ALLOWED_YEAR} and ${MAX_ALLOWED_YEAR}. Current year (${CURRENT_YEAR}) is not allowed.`,
        );
      }

      startLoadingTimer();

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat,
          lon,
          year,
          tz,
          fileType,
        }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      setImgPreview(url);
      setGeneratedType(fileType);
      toast.success(`${title} created successfully`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
    } finally {
      clearLoadingTimer();
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6 text-foreground">
      <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/70 md:p-8">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter DMS coordinates, timezone, year, and output format.
        </p>

        <div className="mt-6 grid gap-5">
          <div className="space-y-2">
            <label htmlFor={`location-${variant}`} className="text-sm font-semibold">
              Enter your site&apos;s coordinates
            </label>
            <input
              type="text"
              title="location"
              id={`location-${variant}`}
              placeholder={`36\u00B044'44.5"N 3\u00B001'12.4"E`}
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="w-full rounded-xl border border-border bg-background/80 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring transition"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor={`year-${variant}`} className="text-sm font-semibold">
                Year
              </label>
              <input
                id={`year-${variant}`}
                type="number"
                min={MIN_ALLOWED_YEAR}
                max={MAX_ALLOWED_YEAR}
                value={year}
                onChange={handleYearChange}
                className="w-full rounded-xl border border-border bg-background/80 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring transition"
              />
              <p className="text-xs text-muted-foreground">
                Current year ({CURRENT_YEAR}) is blocked. Use {MAX_ALLOWED_YEAR} or earlier.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor={`timezone-${variant}`} className="text-sm font-semibold">
                Timezone
              </label>
              <input
                id={`timezone-${variant}`}
                type="text"
                value={tz}
                disabled
                readOnly
                className="w-full rounded-xl border border-border bg-background/80 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring transition"
              />
              <p className="text-xs text-muted-foreground">
                Timezone is fixed for this tool.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">File format</p>
            <div className="flex flex-wrap items-center gap-4">
              <label
                htmlFor={`svg-${variant}`}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background/70 px-4 py-2 text-sm font-medium hover:bg-muted/50"
              >
                <input
                  type="radio"
                  name={`format-${variant}`}
                  id={`svg-${variant}`}
                  value="svg"
                  onChange={() => setFileType("svg")}
                  checked={fileType === "svg"}
                />
                SVG
              </label>

              <label
                htmlFor={`png-${variant}`}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background/70 px-4 py-2 text-sm font-medium hover:bg-muted/50"
              >
                <input
                  type="radio"
                  name={`format-${variant}`}
                  id={`png-${variant}`}
                  value="png"
                  onChange={() => setFileType("png")}
                  checked={fileType === "png"}
                />
                PNG
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={handleGenerate}
              type="button"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Generating..." : "Generate"}
            </button>

            {loading && (
              <p className="text-sm text-muted-foreground">
                Generating... {elapsedSeconds}s elapsed
              </p>
            )}
          </div>

          {loading && isLongWait && (
            <p className="rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-foreground">
              This request is taking longer than usual. Please keep this tab open.
            </p>
          )}
        </div>
      </div>

      {imgPreview && (
        <div className="rounded-3xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/70 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">Preview</h3>
            <a
              href={imgPreview}
              download={`sunpath-${variant}-${Date.now()}.${generatedType}`}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              Download
            </a>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-background/60 p-3">
            <img
              src={imgPreview}
              alt={`Sunpath ${variant} preview`}
              width={1200}
              height={900}
              className="mx-auto h-auto max-h-[70vh] w-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default SunPathTool;
