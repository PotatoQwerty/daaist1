import Image from "next/image";
import banner from "../../public/images/banner.jpg";
import logo from "../../public/images/logo.png";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Club {
  name: string;
  slug: string;
  description: string;
  banner_url?: string;
  logo_url?: string;
}

/**
 * The whole card is the link, so the target is the full block rather than
 * a small button at the bottom. The logo sits inside the content column
 * instead of straddling the banner edge, which kept forcing a large top
 * padding to clear it.
 */
function ClubCard({ club }: { club: Club }) {
  return (
    <Link
      href={`/club/${club.slug}`}
      className="group flex h-full w-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors duration-200 hover:border-domain-clubs"
    >
      <div className="relative h-36 overflow-hidden border-b border-border">
        <Image
          src={club.banner_url || banner}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3">
          <div className="relative size-10 shrink-0 overflow-hidden rounded-full border border-border bg-background">
            <Image
              src={club.logo_url || logo}
              alt=""
              fill
              sizes="40px"
              className="object-cover"
            />
          </div>
          <h3 className="text-lg leading-tight font-bold">{club.name}</h3>
        </div>

        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {club.description}
        </p>

        {/* accent-ink rather than the raw brand red: at 14px the pure
            #ed2024 clears only 4.06:1 on the card, which misses AA. */}
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-accent-ink">
          View club
          <ArrowRight
            className="size-4 transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}

export default ClubCard;
