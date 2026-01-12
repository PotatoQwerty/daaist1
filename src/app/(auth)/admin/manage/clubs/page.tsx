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

async function ClubsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) notFound();
  const { isSuperAdmin } = await getUserRoles(session.user.id);
  if (!isSuperAdmin) notFound();

  const clubs = await getClubs();

  return (
    <RoleGate AllowedRoles={["super_admin"]}>
      <div className="container mx-auto py-10 space-y-8 px-5">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem
            value="create-club"
            className="border rounded-xl px-4 bg-muted/10 data-[state=open]:bg-muted/20 transition-colors"
          >
            <AccordionTrigger className="text-xl font-semibold px-2 py-4 hover:no-underline hover:text-primary transition-colors">
              Create New Club
            </AccordionTrigger>
            <AccordionContent className="px-2 pb-4">
              <CreateClubForm />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="grid gap-6 p-4">
          <h2 className="text-2xl font-bold tracking-tight">Existing Clubs</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clubs?.map((club: any) => (
              <div
                key={club.id}
                className="flex items-center gap-4 p-4 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border">
                  {club.logo_url ? (
                    <Image
                      src={club.logo_url}
                      alt={club.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <span className="text-xs text-muted-foreground">
                        No Logo
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 overflow-hidden">
                  <h3 className="font-semibold truncate" title={club.name}>
                    {club.name}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {club.slug}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        club.is_active
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}
                    >
                      {club.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {clubs?.length === 0 && (
              <div className="col-span-full p-8 text-center text-muted-foreground border rounded-xl border-dashed">
                No clubs found. Create one above!
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleGate>
  );
}

export default ClubsPage;
