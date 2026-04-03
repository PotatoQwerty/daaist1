export async function generateMetadata() {
  const title = "Daa'ist — Clubs";
  const description = "Explore All DAA's clubs, and future events.";
  return {
    title,
    description,
  };
}

import Carossel from "@/components/Carossel";
import ClubCard from "@/components/ClubCard";
import { getClubs, getPublicEvents } from "@/lib/supabase/actions";

export const revalidate = 30;

async function ClubPage() {
  const [clubs, events] = await Promise.all([getClubs(), getPublicEvents()]);

  return (
    <div className="min-h-screen flex flex-col items-center py-20 px-4 sm:px-8">
      <div className="w-full max-w-7xl space-y-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-linear-to-r from-primary to-accent bg-clip-text text-transparent pb-2">
          Explore DAA&#39;s Events
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Discover, join, and find your passion at DAA.
        </p>
        <Carossel data={events} />
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-linear-to-r from-primary to-accent bg-clip-text text-transparent pb-2">
            Explore DAA&#39;s Clubs
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover communities, join events, and find your passion at DAA.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {clubs.length > 0 ? (
            clubs.map((club) => <ClubCard key={club.id} club={club} />)
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl bg-muted/30">
              <p className="text-xl font-semibold text-muted-foreground">
                No clubs found currently.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Check back later for new communities!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClubPage;
