import Image from "next/image";
import placehodler from "../../public/images/placeholder.png";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

interface MessageProps {
  messageContent: string;
  myMsg?: boolean;
  showAvatar: boolean;
  img: string | null;
  username: string;
}

function Message({
  messageContent,
  myMsg,
  showAvatar,
  img,
  username,
}: MessageProps) {
  const Avatar = () => (
    <Link href={`/profile/${username}`} className="shrink-0">
      <Image
        src={img || placehodler}
        width={32}
        height={32}
        className="rounded-full object-cover"
        alt="user profile pic"
      />
    </Link>
  );

  // Invisible spacer to maintain layout when avatar is hidden
  const AvatarSpacer = () => <div className="w-8 h-8 shrink-0" />;

  return (
    <>
      {myMsg ? (
        /* MY MESSAGE (Right Side) */
        <div className="flex place-self-end w-fit max-w-[80%] gap-2 items-end">
          <div
            className={`bg-accent/30 p-3 text-sm ${
              showAvatar
                ? "rounded-l-lg rounded-tr-lg rounded-br-none"
                : "rounded-lg"
            }`}
          >
            <p>{messageContent}</p>
          </div>

          {/* Only show avatar if it's the last one, otherwise show spacer */}
          {showAvatar ? <Avatar /> : <AvatarSpacer />}
        </div>
      ) : (
        /* THEIR MESSAGE (Left Side) */
        <div className="flex w-fit max-w-[80%] gap-2 items-end">
          {/* Only show avatar if it's the last one, otherwise show spacer */}
          {showAvatar ? <Avatar /> : <AvatarSpacer />}

          <div
            className={`bg-primary/30 p-3 text-sm ${
              showAvatar
                ? "rounded-r-lg rounded-tl-lg rounded-bl-none"
                : "rounded-lg"
            }`}
          >
            <p>{messageContent}</p>
          </div>
        </div>
      )}
    </>
  );
}

export default Message;
