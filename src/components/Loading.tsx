"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const STROKE_WIDTH = "3px";

/**
 * The mark drawing itself while content loads.
 *
 * Motivated motion: the three lenses draw in the same order they are
 * introduced as section colours, so the wait teaches the wayfinding
 * instead of spinning.
 */
export default function Loading() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // A looping draw is decoration the moment someone has asked for less
    // motion. Show the finished mark instead.
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const paths = svg.querySelectorAll<SVGPathElement | SVGCircleElement>(
      ".draw-me",
    );
    if (!paths.length) return;

    if (reduced) {
      paths.forEach((path) => {
        gsap.set(path, {
          fill: getComputedStyle(path).stroke,
          strokeDashoffset: 0,
        });
      });
      return;
    }

    // Scoped so revert() below tears down every tween and inline style
    // this effect created. The previous version left an infinite
    // timeline running after unmount.
    const ctx = gsap.context(() => {
      const master = gsap.timeline({ repeat: -1, repeatDelay: 1 });

      paths.forEach((path, i) => {
        const length = (path as SVGPathElement).getTotalLength();

        gsap.set(path, {
          strokeDasharray: length,
          strokeDashoffset: length,
          fill: "none",
          transformOrigin: "center center",
        });

        const tl = gsap.timeline();
        tl.to(path, {
          strokeDashoffset: 0,
          duration: 1.2,
          ease: "power2.inOut",
        })
          .to(
            path,
            {
              // Resolved to a concrete rgb() first: GSAP cannot tween
              // toward an unresolved var() reference.
              fill: getComputedStyle(path).stroke,
              duration: 0.5,
              ease: "power1.inOut",
            },
            "+=0.1",
          )
          .to(path, {
            strokeDashoffset: length,
            fill: "none",
            duration: 0.7,
            ease: "power1.inOut",
            delay: 0.4,
          });

        master.add(tl, i * 0.45);
      });
    }, svg);

    return () => ctx.revert();
  }, []);

  return (
    <div
      className="flex min-h-[60dvh] w-full items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading</span>
      <svg
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 373 447.59"
        className="h-auto w-32 text-foreground"
        aria-hidden="true"
      >
        <path
          className="draw-me"
          d="M0 447.59V0c115.31 2.33 208.1 101.63 208.1 223.8S115.31 445.27 0 447.59Z"
          style={{ stroke: "var(--daa-blue)", strokeWidth: STROKE_WIDTH, fill: "none" }}
        />
        <path
          className="draw-me"
          d="M373 239.54V447.6H166.87c2.12-115.32 92.7-208.1 204.17-208.1.67 0 1.3 0 1.96.04Z"
          style={{ stroke: "var(--daa-red)", strokeWidth: STROKE_WIDTH, fill: "none" }}
        />
        <path
          className="draw-me"
          d="M373 2.54V210.6c-1.14.04-2.32.04-3.46.04-111.47-.79-201.42-94.15-202.76-209.47l206.21 1.37Z"
          style={{ stroke: "var(--daa-yellow)", strokeWidth: STROKE_WIDTH, fill: "none" }}
        />
        {/* currentColor, so the dot survives the theme switch. The old
            hard-coded #231f20 vanished against the dark background. */}
        <circle
          className="draw-me"
          cx={251.29}
          cy={223.79}
          r={23.56}
          style={{ stroke: "currentColor", strokeWidth: STROKE_WIDTH, fill: "none" }}
        />
      </svg>
    </div>
  );
}
