import React from "react";
import { Heart, File } from "lucide-react";
function LikedCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition">
      <div className="relative">
        <File className="size-10" />
        <div className="absolute top-2 right-2 bg-white rounded-full p-2 shadow">
          <Heart fill="var(--accent)" stroke="none" />
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1">“Lighting Project.zip”</h3>
        <p className="text-sm text-gray-500">3rd year (L3)</p>
      </div>
    </div>
  );
}

export default LikedCard;
