import React from "react";
export async function generateMetadata() {
  const title = "Daa'ist — Projects";
  const description =
    "Explore All projects made by DAA students, and much more!.";
  return {
    title,
    description,
  };
}
function page() {
  return (
    <div className="w-full h-screen flex flex-col justify-center items-center">
      <h1 className="text-2xl md:text-4xl text-accent font-bold">
        This page is still under Construction
      </h1>
    </div>
  );
}

export default page;
