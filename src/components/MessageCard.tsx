import { Info, CloudAlert, CircleCheck } from "lucide-react";

type MessageType = "info" | "error" | "success";

interface MessageCardProps {
  type: MessageType | string;
  message: string;
}

const STYLES: Record<MessageType, { bar: string; icon: typeof Info }> = {
  info: { bar: "border-primary", icon: Info },
  error: { bar: "border-destructive", icon: CloudAlert },
  success: { bar: "border-chart-4", icon: CircleCheck },
};

/**
 * Inline notice. A left rule carries the severity colour instead of a
 * tinted fill, which keeps the message text at full contrast in both
 * themes rather than sitting on a translucent wash.
 */
function MessageCard({ type, message }: MessageCardProps) {
  const variant = STYLES[(type as MessageType) in STYLES ? (type as MessageType) : "info"];
  const Icon = variant.icon;

  return (
    <div
      className={`flex w-full items-start gap-3 border-l-2 ${variant.bar} bg-subtle px-4 py-3`}
      role={type === "error" ? "alert" : "status"}
    >
      <Icon
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        strokeWidth={1.75}
        aria-hidden="true"
      />
      <p className="text-sm leading-relaxed text-foreground">{message}</p>
    </div>
  );
}

export default MessageCard;
