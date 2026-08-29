import type { ReactNode } from "react";

type Domain = "courses" | "clubs" | "docs" | "neutral";

const DOMAIN_BAR: Record<Domain, string> = {
  courses: "bg-domain-courses",
  clubs: "bg-domain-clubs",
  docs: "bg-domain-docs",
  neutral: "bg-foreground",
};

type PageHeaderProps = {
  title: string;
  /** One sentence on what this page holds. Kept short by design. */
  lede?: string;
  /**
   * Which lens of the mark this page belongs to. The colour is the
   * wayfinding: blue is coursework, red is community, yellow is the
   * document archive.
   */
  domain?: Domain;
  /** Count, year, or other single value worth annotating. */
  meta?: string;
  /** Back link, filter control, or primary action. */
  children?: ReactNode;
};

/**
 * The standard page head.
 *
 * Replaces the three blurred colour blobs that were copy-pasted across
 * courses, onboarding and profile. Structure does the work here: a
 * domain-coloured bar, a rule, and real margin.
 */
export default function PageHeader({
  title,
  lede,
  domain = "neutral",
  meta,
  children,
}: PageHeaderProps) {
  return (
    <header className="rule-b pb-8">
      <div className={`h-1 w-16 ${DOMAIN_BAR[domain]}`} aria-hidden="true" />

      <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="text-4xl leading-[1.05] font-bold md:text-5xl">
            {title}
          </h1>
          {lede && (
            <p className="mt-3 max-w-[58ch] text-base text-muted-foreground">
              {lede}
            </p>
          )}
        </div>

        {(meta || children) && (
          <div className="flex shrink-0 items-center gap-4">
            {meta && <span className="annot">{meta}</span>}
            {children}
          </div>
        )}
      </div>
    </header>
  );
}
