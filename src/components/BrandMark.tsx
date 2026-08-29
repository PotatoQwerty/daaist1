type Lens = "courses" | "clubs" | "docs";

/**
 * The DAA mark, drawn at display scale.
 *
 * Geometry is lifted verbatim from public/images/DAAIST-LOGO-HOR.svg so
 * this stays the real mark rather than an approximation of it. Inlining
 * buys one thing a raster or <img> could not: each lens can be tied to a
 * content domain and lit independently, which is what makes the colour
 * coding on the index below legible instead of arbitrary.
 *
 * Decorative here. The index rows carry the actual navigation, so this is
 * hidden from assistive technology rather than duplicating those links.
 */
export default function BrandMark({
  active,
  className = "",
}: {
  /** Lens to hold at full strength; the others recede. */
  active?: Lens | null;
  className?: string;
}) {
  const dim = (lens: Lens) =>
    active && active !== lens ? "opacity-20" : "opacity-100";

  return (
    <svg
      viewBox="0 0 373 448.06"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M0,447.83V.23c115.31,2.33,208.1,101.63,208.1,223.8S115.31,445.5,0,447.83Z"
        fill="var(--domain-courses)"
        className={`transition-opacity duration-300 ${dim("courses")}`}
      />
      <path
        d="M373,239.77v208.06h-206.13c2.12-115.32,92.7-208.1,204.17-208.1.67,0,1.3,0,1.96.04Z"
        fill="var(--domain-clubs)"
        className={`transition-opacity duration-300 ${dim("clubs")}`}
      />
      <path
        d="M373,2.78v208.06c-1.14.04-2.32.04-3.46.04-111.47-.79-201.42-94.15-202.76-209.47l206.21,1.37Z"
        fill="var(--domain-docs)"
        className={`transition-opacity duration-300 ${dim("docs")}`}
      />
      <circle
        cx="251.29"
        cy="224.03"
        r="23.56"
        fill="currentColor"
        className="transition-opacity duration-300"
      />
    </svg>
  );
}
