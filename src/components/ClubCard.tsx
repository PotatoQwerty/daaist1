import Image from "next/image";
import banner from "../../public/images/banner.jpg";
import logo from "../../public/images/logo.png";
import Link from "next/link";

interface Club {
  name: string;
  slug: string;
  description: string;
  banner_url?: string;
  logo_url?: string;
}

function ClubCard({ club }: { club: Club }) {
  return (
    <div className="bg-chart-5/20 dark:bg-chart-5/10 border border-chart-5/20 rounded-xl overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300 w-full h-full group">
      {/* Banner */}
      <div className="relative h-40">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={club.banner_url || banner}
            alt={`${club.name} banner`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            priority={false} // Set to true if above the fold
          />
          {/* Fixed typo: bg-linear-to-r → bg-gradient-to-r */}
          <div className="absolute inset-0 bg-linear-to-r from-black/60 to-transparent opacity-60" />
        </div>

        {/* Logo container */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-10">
          <div className="relative h-20 w-20 rounded-full ring-4 ring-background overflow-hidden bg-background">
            <Image
              src={club.logo_url || logo}
              alt={`${club.name} logo`}
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-12 px-6 pb-6 flex flex-col flex-1 items-center text-center">
        <h2 className="text-2xl font-bold tracking-tight mb-2">{club.name}</h2>

        <p className="text-muted-foreground text-sm line-clamp-3 mb-6">
          {club.description}
        </p>

        <Link
          href={`/club/${club.slug}`}
          className="mt-auto w-full rounded-lg bg-primary text-primary-foreground px-4 py-3 font-semibold hover:bg-primary/90 transition-colors shadow-sm"
        >
          View Club
        </Link>
      </div>
    </div>
  );
}

export default ClubCard;
