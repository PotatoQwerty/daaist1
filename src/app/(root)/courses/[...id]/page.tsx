"use client";
import React, { useState, use } from "react";
import Link from "next/link";
import {
  subjectOptions,
  type LevelKey,
} from "../../../../../constants/uploadConstants";
import { SearchIcon } from "lucide-react";

export default function CoursesPage({
  params,
}: {
  params: Promise<{ id: string[] }>;
}) {
  const { id: idArray } = use(params);
  const idFromPromise = idArray.join("/");
  const key = idFromPromise as LevelKey;
  const subjectsForLevel = subjectOptions[key] ?? [];
  const [search, setSearch] = useState("");

  const filteredSubjects = subjectsForLevel.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-background to-accent/10 flex flex-col items-center px-4 py-10">
      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 text-foreground">
        {idArray.join(" / ")} Courses
      </h1>

      {/* Search Bar */}
      <div className="w-full max-w-lg flex items-center gap-2 rounded-2xl border border-accent/40 focus-within:border-primary bg-card px-4 py-3 shadow-sm transition-all duration-200 mb-10">
        <SearchIcon className="w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          name="search"
          id="search"
          className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none"
          placeholder={`Search among ${subjectsForLevel.length} subjects`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Subjects Grid */}
      {filteredSubjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 w-full max-w-6xl">
          {filteredSubjects.map((item) => (
            <Link
              key={item.value}
              href={`/courses/${idFromPromise}/${item.value}`}
              className="relative flex flex-col items-center justify-center w-full h-[220px] rounded-2xl bg-card border border-accent/30 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 group hover:bg-accent/5"
            >
              <span className="text-lg font-semibold text-foreground">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground mt-10 text-center">
          No subjects found for "{search}".
        </p>
      )}
    </div>
  );
}
