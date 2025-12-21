import Image from "next/image";
import placeholder from "../../public/images/placeholder.png";
import Link from "next/link";
import { memo } from "react";

interface MessageProps {
  messageContent: string;
  myMsg?: boolean;
  showAvatar: boolean;
  img: string | null;
  username: string;
}
const Message = memo(function Message({
  messageContent,
  myMsg,
  showAvatar,
  img,
  username,
}: MessageProps) {
  const Avatar = () => (
    <Link href={`/profile/${username}`} className="shrink-0 relative">
      <Image
        src={img || placeholder}
        width={32}
        height={32}
        // FIX 2: Added 'w-8 h-8' to force square aspect ratio
        className="rounded-full object-cover w-8 h-8 border border-gray-100"
        alt="user profile pic"
      />
    </Link>
  );

  const AvatarSpacer = () => <div className="w-8 h-8 shrink-0" />;


  return (
    <div className={`w-full flex ${myMsg ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[80%] flex gap-2 items-end">
        {myMsg ? (
          <div
            className={`bg-accent/30 p-2 text-sm whitespace-pre-wrap break-all ${
              showAvatar
                ? "rounded-l-lg rounded-tr-lg rounded-br-none"
                : "rounded-lg"
            }`}
          >
            <p>{messageContent}</p>
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
                className={`bg-primary/30 p-2 text-sm whitespace-pre-wrap break-all ${
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
