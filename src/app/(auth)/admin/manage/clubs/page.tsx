import CreateClubForm from "@/app/(auth)/_components/CreateClubForm";
import { createClient } from "@/lib/supabase/server";
import { RoleGate } from "@/components/RoleGate";
import { getClubs, getUserRoles } from "@/lib/supabase/actions";
import { notFound } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Image from "next/image";
import EmptyState from "@/components/EmptyState";
import { School } from "lucide-react";
import { cn } from "@/lib/utils";

export const revalidate = 1800;

export const metadata = {
  title: "Daa'ist - Manage Clubs",
  description: "Manage Daa'ist clubs.",
  alternates: {
    canonical: "https://daaist.com/admin/manage/clubs",
  },
};

async function ClubsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return notFound();
  const { isSuperAdmin } = await getUserRoles(user.id);
  if (!isSuperAdmin) return notFound();

  const clubs = await getClubs();

  return (
    <RoleGate AllowedRoles={["super_admin"]}>
      <div className="relative min-h-screen w-full bg-background text-foreground">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-background to-secondary/10" />
          <div className="absolute -top-24 right-10 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        </div>

        <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-10">
          <header className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
              Admin
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Manage clubs
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Create new clubs and review existing communities.
            </p>
          </header>

          <section className="rounded-3xl border border-border/60 bg-card/80 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/70">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="create-club" className="border-0">
                <AccordionTrigger className="px-6 py-5 text-left text-lg font-semibold hover:no-underline">
                  Create new club
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <CreateClubForm />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
                  Existing clubs
                </h2>
                <p className="text-sm text-muted-foreground">
                  {clubs?.length ?? 0} club{(clubs?.length ?? 0) === 1 ? "" : "s"}
                  {clubs?.length ? " total." : "."}
                </p>
              </div>
            </div>

            {clubs?.length ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {clubs.map((club: any) => (
                  <div
                    key={club.id}
                    className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/70 transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-accent/10" />
                    </div>

                    <div className="relative flex items-start gap-4">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted/30">
                        {club.logo_url ? (
                          <Image
                            src={club.logo_url}
                            alt={club.name}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted/40">
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              No logo
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3
                              className="truncate text-base font-semibold text-foreground"
                              title={club.name}
                            >
                              {club.name}
                            </h3>
                            <p className="truncate text-xs text-muted-foreground">
                              {club.slug}
                            </p>
                          </div>

                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                              club.is_active
                                ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                                : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
                            )}
                          >
                            {club.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>

                        {club.description ? (
                          <p className="line-clamp-3 text-sm text-muted-foreground">
                            {club.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={School}
                title="No clubs found"
                description="Create your first club using the section above."
              />
            )}
          </section>
        </div>
      </div>
    </RoleGate>
  );
}

export default ClubsPage;
