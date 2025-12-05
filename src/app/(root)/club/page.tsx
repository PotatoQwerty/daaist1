import React from "react";
import type { Metadata } from "next";
export async function generateMetadata() {
  const title = "Daa'ist — Clubs";
  const description = "Explore All DAA's clubs, and future events.";
  return {
    title,
    description,
  };
}
function page() {
  return (
    <div className="w-full h-screen flex flex-col justify-center items-center">
      <h1 className="text-2xl md:text-4xl text-accent font-bold">
        Oops Our developer ran away!
      </h1>
      <p className="text-xs text-gray-500 md:text-lg">Again...</p>
    </div>
  );
}

export default page;
