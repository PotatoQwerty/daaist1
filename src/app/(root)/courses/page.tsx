import { yearOptions } from "@/constants/uploadConstants";
import Link from "next/link";

export const metadata = {
  title: "Daa'ist — Courses by Year",
  description:
    "Explore courses, resources, and materials for all academic years.",
  alternates: {
    canonical: "https://daaist.com/courses",
  },
};
export default function FilesList() {
  return (
    <div className="min-h-screen w-full bg-linear-to-b from-background to-accent/10 flex flex-col items-center px-4 py-10">
      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 text-foreground">
        View Courses by Year
      </h1>

      {/* Grid of Years */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-5xl">
        {yearOptions.map((item) => (
          <Link
            key={item.value}
            href={`/courses/${item.value}`}
            className="relative flex flex-col items-center justify-center w-full h-[220px] rounded-2xl bg-card border border-accent/30 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 group"
          >
            <div className="absolute inset-0 bg-accent/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

            <span className="text-xl font-semibold text-foreground relative z-10">
              {item.label}
            </span>

            <span className="text-sm text-muted-foreground mt-1 relative z-10">
              Explore resources
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
