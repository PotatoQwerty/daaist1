import {
  getClubBySlug,
  getEventById,
  getUserClubRole,
} from "@/lib/supabase/actions";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import banner from "../../../../../public/images/banner.jpg";
import logo from "../../../../../public/images/logo.png";
import Carossel from "@/components/Carossel";
import ManageClub from "@/components/ManageClub";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const club = await getClubBySlug(slug);
  if (!club) {
    return {
      title: "Club Not Found",
    };
  }
  return {
    title: `${club.name} - Daa'ist`,
    description: club.description,
  };
}

async function ClubDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const club = await getClubBySlug(slug);

  if (!club) return notFound();
  const events = await getEventById(club.id);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;
  const role = userId ? await getUserClubRole(userId, club.id) : null;
  const canManageEvents =
    role === "president" ||
    role === "vice_president" ||
    role === "event_manager";
  const visibleEvents = canManageEvents
    ? events
    : events?.filter((event) => event.is_public);

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-6 md:py-16">
      <Link
        href="/club"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        All clubs
      </Link>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="relative h-56 w-full border-b border-border md:h-72">
          <Image
            src={club.banner_url || banner}
            alt=""
            fill
            sizes="(max-width: 1400px) 100vw, 1400px"
            className="object-cover"
            priority
          />
        </div>

        <div className="p-6 md:p-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-full border border-border bg-background md:size-24">
              <Image
                src={club.logo_url || logo}
                alt={`${club.name} logo`}
                sizes="96px"
                fill
                className="object-cover"
              />
            </div>

            <div className="min-w-0">
              <h1 className="text-3xl leading-tight font-bold md:text-4xl">
                {club.name}
              </h1>
              <p className="annot mt-2 inline-flex items-center gap-2">
                <span
                  className={`size-2 rounded-full ${
                    club.is_active ? "bg-chart-4" : "bg-muted-foreground"
                  }`}
                  aria-hidden="true"
                />
                {club.is_active ? "Active" : "Inactive"}
              </p>
            </div>
          </div>

          <div className="rule-t mt-8 pt-8">
            <h2 className="text-lg font-bold">About</h2>
            <p className="mt-3 max-w-[68ch] leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {club.description}
            </p>
          </div>

          <div className="socials mt-8 flex gap-4 text-muted-foreground">
            {club.socials.facebook && (
              <Link
                href={club.socials.facebook || "#"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${club.name} on Facebook`}
              >
                <svg
                  className="facebook"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 640 640"
                  width={30}
                  height={30}
                >
                  <path d="M240 363.3L240 576L356 576L356 363.3L442.5 363.3L460.5 265.5L356 265.5L356 230.9C356 179.2 376.3 159.4 428.7 159.4C445 159.4 458.1 159.8 465.7 160.6L465.7 71.9C451.4 68 416.4 64 396.2 64C289.3 64 240 114.5 240 223.4L240 265.5L174 265.5L174 363.3L240 363.3z" />
                </svg>
              </Link>
            )}
            {club.socials.tiktok && (
              <Link
                href={club.socials.tiktok || "#"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${club.name} on Tiktok`}
              >
                <svg
                  className="tiktok"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 640 640"
                  width={30}
                  height={30}
                >
                  <path d="M544.5 273.9C500.5 274 457.5 260.3 421.7 234.7L421.7 413.4C421.7 446.5 411.6 478.8 392.7 506C373.8 533.2 347.1 554 316.1 565.6C285.1 577.2 251.3 579.1 219.2 570.9C187.1 562.7 158.3 545 136.5 520.1C114.7 495.2 101.2 464.1 97.5 431.2C93.8 398.3 100.4 365.1 116.1 336C131.8 306.9 156.1 283.3 185.7 268.3C215.3 253.3 248.6 247.8 281.4 252.3L281.4 342.2C266.4 337.5 250.3 337.6 235.4 342.6C220.5 347.6 207.5 357.2 198.4 369.9C189.3 382.6 184.4 398 184.5 413.8C184.6 429.6 189.7 444.8 199 457.5C208.3 470.2 221.4 479.6 236.4 484.4C251.4 489.2 267.5 489.2 282.4 484.3C297.3 479.4 310.4 469.9 319.6 457.2C328.8 444.5 333.8 429.1 333.8 413.4L333.8 64L421.8 64C421.7 71.4 422.4 78.9 423.7 86.2C426.8 102.5 433.1 118.1 442.4 131.9C451.7 145.7 463.7 157.5 477.6 166.5C497.5 179.6 520.8 186.6 544.6 186.6L544.6 274z" />
                </svg>
              </Link>
            )}
            {club.socials.instagram && (
              <Link
                href={club.socials.instagram || "#"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${club.name} on Instagram`}
              >
                <svg
                  className="instagram"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 640 640"
                  width={30}
                  height={30}
                >
                  <defs>
                    <linearGradient
                      id="igGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#F58529" />
                      <stop offset="40%" stopColor="#DD2A7B" />
                      <stop offset="70%" stopColor="#8134AF" />
                      <stop offset="100%" stopColor="#515BD4" />
                    </linearGradient>
                  </defs>
                  <path d="M320.3 205C256.8 204.8 205.2 256.2 205 319.7C204.8 383.2 256.2 434.8 319.7 435C383.2 435.2 434.8 383.8 435 320.3C435.2 256.8 383.8 205.2 320.3 205zM319.7 245.4C360.9 245.2 394.4 278.5 394.6 319.7C394.8 360.9 361.5 394.4 320.3 394.6C279.1 394.8 245.6 361.5 245.4 320.3C245.2 279.1 278.5 245.6 319.7 245.4zM413.1 200.3C413.1 185.5 425.1 173.5 439.9 173.5C454.7 173.5 466.7 185.5 466.7 200.3C466.7 215.1 454.7 227.1 439.9 227.1C425.1 227.1 413.1 215.1 413.1 200.3zM542.8 227.5C541.1 191.6 532.9 159.8 506.6 133.6C480.4 107.4 448.6 99.2 412.7 97.4C375.7 95.3 264.8 95.3 227.8 97.4C192 99.1 160.2 107.3 133.9 133.5C107.6 159.7 99.5 191.5 97.7 227.4C95.6 264.4 95.6 375.3 97.7 412.3C99.4 448.2 107.6 480 133.9 506.2C160.2 532.4 191.9 540.6 227.8 542.4C264.8 544.5 375.7 544.5 412.7 542.4C448.6 540.7 480.4 532.5 506.6 506.2C532.8 480 541 448.2 542.8 412.3C544.9 375.3 544.9 264.5 542.8 227.5zM495 452C487.2 471.6 472.1 486.7 452.4 494.6C422.9 506.3 352.9 503.6 320.3 503.6C287.7 503.6 217.6 506.2 188.2 494.6C168.6 486.8 153.5 471.7 145.6 452C133.9 422.5 136.6 352.5 136.6 319.9C136.6 287.3 134 217.2 145.6 187.8C153.4 168.2 168.5 153.1 188.2 145.2C217.7 133.5 287.7 136.2 320.3 136.2C352.9 136.2 423 133.6 452.4 145.2C472 153 487.1 168.1 495 187.8C506.7 217.3 504 287.3 504 319.9C504 352.5 506.7 422.6 495 452z" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>

      <section className="mt-16">
        <h2 className="text-2xl font-bold sm:text-3xl">Upcoming events</h2>
        <div className="mt-6">
          <Carossel data={visibleEvents ?? []} />
        </div>
      </section>

      <div className="mt-12">
        <ManageClub club={club} role={role} />
      </div>
    </main>
  );
}

export default ClubDetailsPage;
