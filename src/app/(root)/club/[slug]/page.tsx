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
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  const role = userId ? await getUserClubRole(userId, club.id) : null;

  return (
    <div className="min-h-screen py-20 px-4 sm:px-8 flex flex-col items-center gap-10">
      <div className="w-full max-w-5xl bg-card border rounded-2xl overflow-hidden shadow-sm">
        {/* Banner Section */}
        <div className="relative h-64 md:h-80 w-full">
          <Image
            src={club.banner_url || banner}
            alt={`${club.name} banner`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

          <div className="absolute -bottom-16 left-8 md:left-12 z-20">
            <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-full border-4 border-background bg-background overflow-hidden shadow-md">
              <Image
                src={club.logo_url || logo}
                alt={`${club.name} logo`}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>

        {/* Club Info */}
        <div className="pt-20 px-8 md:px-12 pb-12 space-y-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              {club.name}
            </h1>
            <div className="flex items-center gap-3 mt-3">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                  club.is_active
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                }`}
              >
                {club.is_active ? "Active Club" : "Inactive"}
              </span>
            </div>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <h3 className="text-xl font-semibold mb-2">About Us</h3>
            <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
              {club.description}
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl space-y-4">
        <h2 className="text-2xl font-bold">Upcoming {club.name} Events</h2>
        <Carossel data={events as any} />
      </div>

      <div className="w-full max-w-5xl">
        <ManageClub club={club} role={role} />
      </div>
    </div>
  );
}

export default ClubDetailsPage;
