"use client";

import { useState } from "react";
import type { DiagramAppearance } from "@/lib/diagramAppearance";

export type GeneratedDiagram = {
  url: string;
  theme: DiagramAppearance["theme"];
  filename: string;
};

export default function DiagramPreview({ diagram, width, height, alt }: {
  diagram: GeneratedDiagram;
  width: number;
  height: number;
  alt: string;
}) {
  const [darkSurface, setDarkSurface] = useState(true);
  const transparent = diagram.theme === "transparent";

  return (
    <div className="rounded-lg border border-border bg-card p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">Preview</h3>
        <a
          href={diagram.url}
          download={diagram.filename}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          Download
        </a>
      </div>
      {transparent && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <button
            type="button"
            aria-pressed={darkSurface}
            onClick={() => setDarkSurface((current) => !current)}
            className="rounded-md border border-border px-3 py-2 hover:bg-muted/50"
          >
            Dark preview surface: {darkSurface ? "on" : "off"}
          </button>
          <span className="text-muted-foreground">Preview surface only; download stays transparent.</span>
        </div>
      )}
      <div
        className="mt-4 overflow-hidden rounded-lg border border-border p-3"
        style={{
          backgroundColor: transparent && darkSurface ? "#20242b" : "#f5f5f5",
          backgroundImage: transparent ? `conic-gradient(${darkSurface ? "#303640" : "#e0e0e0"} 25%, transparent 0 50%, ${darkSurface ? "#303640" : "#e0e0e0"} 0 75%, transparent 0)` : undefined,
          backgroundSize: "20px 20px",
        }}
      >
        {/* Blob URLs preserve the API's original PNG/SVG bytes. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={diagram.url}
          alt={alt}
          width={width}
          height={height}
          style={{ aspectRatio: `${width} / ${height}`, width: `min(100%, ${70 * width / height}vh)` }}
          className="mx-auto h-auto object-contain"
        />
      </div>
    </div>
  );
}
