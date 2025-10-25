import React from "react";

function UploadedCard({ title }: { title: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition p-5 border border-gray-100">
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-gray-500 text-sm mb-2">
        Uploaded 2 days ago · M1 Year
      </p>
      <div className="flex justify-between items-center mt-4">
        <span className="text-xs text-gray-400">File type: PDF</span>
        <button className="text-primary font-medium hover:underline">
          View
        </button>
      </div>
    </div>
  );
}

export default UploadedCard;
