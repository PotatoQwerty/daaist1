import Image from "next/image";
import placeholder from "../../public/images/placeholder.png";
import Link from "next/link";
import { memo } from "react";
import { AlertCircle } from "lucide-react";

interface MessageProps {
  messageContent: string;
  myMsg?: boolean;
  showAvatar: boolean;
  userId?: string;
  img: string | null;
  username: string;
  isFailed?: boolean;
}

const Message = memo(function Message({
  messageContent,
  myMsg,
  showAvatar,
  userId,
  img,
  username,
  isFailed,
}: MessageProps) {
  const profileSlug = userId || username;
  const Avatar = () => (
    <Link
      href={`/profile/${profileSlug}`}
      className="shrink-0 relative"
      aria-label={`View ${username}'s profile`}
    >
      <Image
        src={img || placeholder}
        width={32}
        height={32}
        className="rounded-full object-cover w-8 h-8 border border-border"
        alt={`${username}'s profile picture`}
        loading="lazy"
      />
    </Link>
  );

  const AvatarSpacer = () => <div className="w-8 h-8 shrink-0" />;

  return (
    <div className={`w-full flex ${myMsg ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[80%] flex gap-2 items-end">
        {myMsg ? (
          <div className="flex flex-col items-end gap-1">
            <div
              className={`bg-accent/30 p-2 text-sm whitespace-pre-wrap wrap-break-word ${
                showAvatar
                  ? "rounded-l-lg rounded-tr-lg rounded-br-none"
                  : "rounded-lg"
              } ${isFailed ? "opacity-50 border border-destructive" : ""}`}
            >
              <p>{messageContent}</p>
            </div>
            {isFailed && (
              <div className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="size-3" />
                <span>Failed to send</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col">
            {showAvatar ? (
              <span className="ml-9 mb-0.5 text-xs text-muted-foreground">
                {username}
              </span>
            ) : null}
            <div className="flex gap-1">
              {showAvatar ? <Avatar /> : <AvatarSpacer />}
              <div
                className={`bg-primary/30 p-2 text-sm whitespace-pre-wrap wrap-break-word ${
                  showAvatar
                    ? "rounded-r-lg rounded-tl-lg rounded-bl-none"
                    : "rounded-lg"
                }`}
              >
                <p>{messageContent}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default Message;
