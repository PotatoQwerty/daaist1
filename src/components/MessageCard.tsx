import React from "react";
interface MessageCardProps {
  type: string;
  message: string;
}
function MessageCard({ type, message }: MessageCardProps) {
  return (
    <div
      className={`rounded-md p-2 text-foreground text-xl w-full ${
        type === "error"
          ? "bg-accent/60"
          : type === "info"
          ? "bg-primary/60"
          : "bg-chart-4/60"
      }`}
    >
      <p>{message}</p>
    </div>
  );
}

export default MessageCard;
