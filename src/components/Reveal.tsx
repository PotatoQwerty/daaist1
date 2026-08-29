"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Stagger offset in ms, for sequencing siblings in a list. */
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
};

/**
 * Entry reveal for content arriving on scroll.
 *
 * IntersectionObserver rather than a scroll listener: it fires off the
 * main thread, batches, and disconnects the moment an element has been
 * shown. The transition itself lives in globals.css (.reveal), which
 * already collapses to a no-op under prefers-reduced-motion, so nothing
 * here needs to branch on the media query.
 *
 * The observer is attached from a callback ref rather than an effect, so
 * the element is wired up the instant it mounts and there is no
 * synchronous setState during the effect pass.
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: RevealProps) {
  const [shown, setShown] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const attach = useCallback((node: HTMLElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;

    if (!node) return;

    // Without observer support there is nothing to wait for, so reveal
    // immediately rather than leaving the content permanently hidden.
    if (typeof IntersectionObserver === "undefined") {
      node.dataset.shown = "true";
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(node);
    observerRef.current = observer;
  }, []);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return (
    <Tag
      ref={attach}
      data-shown={shown}
      style={
        delay
          ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties)
          : undefined
      }
      className={`reveal ${className}`}
    >
      {children}
    </Tag>
  );
}
