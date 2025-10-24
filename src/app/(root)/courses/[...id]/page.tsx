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

  return (
    <div className="p-5 flex justify-center items-center">
      {/* search input */}
      <div className="w-full max-w-lg flex items-center gap-2 rounded-xl border-2 border-accent focus-within:border-primary transition-colors px-3 py-2  bg-background shadow">
        <input
          type="text"
          name="search"
          id="search"
          className="flex-1 text-foreground outline-none"
          aria-placeholder="search input"
          placeholder={`Search in all ${idArray} resources`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="button" className="text-secondary transition-colors">
          <SearchIcon className="w-6 h-6" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 w-full h-full place-items-center">
        {subjectsForLevel.map((item) => (
          <div key={item.value}>
            <Link
              href={`/courses/${idFromPromise}/${item.value}`}
              className="flex items-center justify-center p-3 bg-accent hover:bg-accent/80 hover:scale-110 rounded-2xl w-[200px] h-[200px] transition-all ease-in-out duration-200"
            >
              <span className="font-bold">{item.label}</span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
