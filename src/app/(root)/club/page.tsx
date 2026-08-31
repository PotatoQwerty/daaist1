import Carossel from "@/components/Carossel";
import ClubCard from "@/components/ClubCard";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import { getClubs, getPublicEvents } from "@/lib/supabase/actions";
import type { Metadata } from "next";
import { SITE_NAME, absoluteUrl } from "@/lib/site";

const CLUBS_DESCRIPTION =
  "The student clubs running at the Département d'Architecture d'Alger, and the events they have coming up.";

export const metadata: Metadata = {
  title: "Clubs",
  description: CLUBS_DESCRIPTION,
  alternates: { canonical: absoluteUrl("/club") },
  openGraph: {
    type: "website",
    url: absoluteUrl("/club"),
    title: `Clubs | ${SITE_NAME}`,
    description: CLUBS_DESCRIPTION,
  },
};

export const revalidate = 30;

async function ClubPage() {
  const [clubs, events] = await Promise.all([getClubs(), getPublicEvents()]);

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-6 md:py-16">
      <PageHeader
        title="Clubs"
        lede="The student clubs running at DAA, and the events they have coming up."
        domain="clubs"
        meta={`${clubs.length} ${clubs.length === 1 ? "club" : "clubs"}`}
      />

      <section className="mt-14">
        <h2 className="text-2xl font-bold sm:text-3xl">Upcoming events</h2>
        <div className="mt-6">
          <Carossel data={events} />
        </div>
      </section>

      <section className="rule-t mt-16 pt-12">
        <h2 className="text-2xl font-bold sm:text-3xl">All clubs</h2>

        {clubs.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club, i) => (
              <Reveal key={club.id} delay={i * 60} className="h-full">
                <ClubCard club={club} />
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="mt-8 border border-dashed border-border px-6 py-12 text-center text-muted-foreground">
            No clubs are listed yet. Once a club is registered it shows up here.
          </p>
        )}
      </section>
    </main>
  );
}

export default ClubPage;
