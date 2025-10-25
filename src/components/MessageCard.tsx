import React from "react";

import { Info, CloudAlert } from "lucide-react";
interface MessageCardProps {
  type: string;
  message: string;
}
function MessageCard({ type, message }: MessageCardProps) {
  return (
    <div
      className={`rounded-md flex gap-1 justify-center items-center p-2 text-foreground text-xl w-full ${
        type === "error"
          ? "bg-accent/60"
          : type === "info"
          ? "bg-primary/60"
          : "bg-chart-4/60"
      }`}
    >
      {type === "info" ? (
        <Info className="size-18 px-2" />
      ) : (
        <CloudAlert className="size-18 px-2" />
      )}

      <p className="text-start">{message}</p>
    </div>
  );
}

export default MessageCard;
