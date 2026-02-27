"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

const LONG_WAIT_MS = 30000;
const COLD_START_SOUND = "/sounds/coldstart.mp3";

function parseDMS(input: string): { lat: number | null; lon: number | null } {
  const regex = /(\d+)°(\d+)'([\d.]+)"([NSEW])/g;
  const matches = [...input.matchAll(regex)];

  let lat: number | null = null;
  let lon: number | null = null;

  for (const match of matches) {
    const degrees = Number(match[1]);
    const minutes = Number(match[2]);
    const seconds = Number(match[3]);
    const direction = match[4];

    let decimal = degrees + minutes / 60 + seconds / 3600;
    if (direction === "S" || direction === "W") decimal *= -1;

    if (direction === "N" || direction === "S") {
      lat = Number(decimal.toFixed(6));
    } else {
      lon = Number(decimal.toFixed(6));
    }
  }

  return { lat, lon };
}

type FileType = "png" | "svg";

function WindRose() {
  const [location, setLocation] = useState("");
  const [fileType, setFileType] = useState<FileType>();
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [generatedType, setGeneratedType] = useState<FileType | null>(null);
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

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileType(e.target.value as FileType);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setIsLongWait(false);
    setImgPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setGeneratedType(null);

    const { lat, lon } = parseDMS(location);

    try {
      if (lat == null || lon == null) throw new Error("Invalid coordinates");
      if (!fileType) throw new Error("Pick png or svg");

      startLoadingTimer();

      const res = await fetch("/api/tools/windrose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lon, fileType }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to generate windrose");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      setImgPreview(url);
      setGeneratedType(fileType);
      toast.success("Windrose created successfully");
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong. Try again later.");
    } finally {
      clearLoadingTimer();
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6 text-foreground">
      <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/70 md:p-8">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Windrose Generator
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter DMS coordinates and choose an output format.
          </p>

          <div className="mt-6 grid gap-5">
            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-semibold">
                Enter your site&apos;s coordinates
              </label>
              <input
                type="text"
                title="location"
                id="location"
                placeholder={`36°44'44.5"N 3°01'12.4"E`}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl border border-border bg-background/80 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring transition"
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">File format</p>
              <div className="flex flex-wrap items-center gap-4">
                <label
                  htmlFor="svg"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background/70 px-4 py-2 text-sm font-medium hover:bg-muted/50"
                >
                  <input
                    type="radio"
                    name="format"
                    id="svg"
                    value="svg"
                    title="file format"
                    onChange={handleRadioChange}
                    checked={fileType === "svg"}
                  />
                  SVG
                </label>

                <label
                  htmlFor="png"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background/70 px-4 py-2 text-sm font-medium hover:bg-muted/50"
                >
                  <input
                    type="radio"
                    name="format"
                    id="png"
                    value="png"
                    title="file format"
                    onChange={handleRadioChange}
                    checked={fileType === "png"}
                  />
                  PNG
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={handleGenerate}
                title="Generate windrose"
                aria-label="Generate windrose"
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
            <h2 className="text-lg font-semibold">Preview</h2>
            <a
              href={imgPreview}
              download={`windrose-${Date.now()}.${generatedType ?? "png"}`}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              Download
            </a>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-background/60 p-3">
            <img
              src={imgPreview}
              alt="Windrose Preview"
              width={900}
              height={900}
              className="mx-auto h-auto max-h-[70vh] w-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default WindRose;
