import { notFound } from "next/navigation";
import { Users, FileText, Heart, School, UserCheck, Link } from "lucide-react";
import MainAdmin from "../_components/MainAdmin";
import { getUserRoles } from "@/lib/supabase/actions";
import { createClient, supabaseServer } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();
  const { isAdmin, isSuperAdmin } = await getUserRoles(user.id);
  if (!isAdmin && !isSuperAdmin) notFound();

  const getCount = async (label: string, query: PromiseLike<any>) => {
    const { count, error } = await query;
    if (error) {
      console.error(`Error fetching ${label} count:`, error);
      return 0;
    }
    return count ?? 0;
  };

  const [
    usersCount,
    filesCount,
    likesCount,
    clubsCount,
    activeClubsCount,
    clubMembersCount,
    pendingInvitesCount,
  ] = await Promise.all([
    getCount(
      "users",
      supabaseServer
        .schema("public")
        .from("profiles")
        .select("user_id", { count: "exact", head: true })
    ),
    getCount(
      "files",
      supabaseServer
        .schema("public")
        .from("files")
        .select("id", { count: "exact", head: true })
    ),
    getCount(
      "likes",
      supabaseServer
        .schema("public")
        .from("likes")
        .select("id", { count: "exact", head: true })
    ),
    getCount(
      "clubs",
      supabaseServer
        .schema("public")
        .from("clubs")
        .select("id", { count: "exact", head: true })
    ),
    getCount(
      "active clubs",
      supabaseServer
        .schema("public")
        .from("clubs")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
    ),
    getCount(
      "club members",
      supabaseServer
        .schema("public")
        .from("club_members")
        .select("id", { count: "exact", head: true })
    ),
    getCount(
      "pending invites",
      supabaseServer
        .schema("public")
        .from("invites")
        .select("id", { count: "exact", head: true })
        .is("used_at", null)
    ),
  ]);

  const stats = [
    {
      label: "Users",
      value: usersCount,
      helper: "Registered profiles",
      icon: Users,
      accent: "text-primary bg-primary/10",
    },
    {
      label: "Files",
      value: filesCount,
      helper: "Uploads stored",
      icon: FileText,
      accent: "text-accent bg-accent/10",
    },
    {
      label: "Favorites",
      value: likesCount,
      helper: "Total likes",
      icon: Heart,
      accent: "text-accent bg-accent/10",
    },
    {
      label: "Clubs",
      value: clubsCount,
      helper: `${activeClubsCount} active`,
      icon: School,
      accent: "text-primary bg-primary/10",
    },
    {
      label: "Club Members",
      value: clubMembersCount,
      helper: "Memberships",
      icon: UserCheck,
      accent: "text-primary bg-primary/10",
    },
    {
      label: "Pending Invites",
      value: pendingInvitesCount,
      helper: "Awaiting signup",
      icon: Link,
      accent: "text-accent bg-accent/10",
    },
  ];

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-background to-secondary/10" />
        <div className="absolute -top-24 right-10 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-6xl space-y-8 px-6 py-10">
        <header className="flex flex-col gap-3 text-center md:text-left">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Overview
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Key metrics and tools to manage Daa&apos;ist.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/70"
              >
                <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-accent/10 opacity-0 transition group-hover:opacity-100" />
                <div className="relative flex items-start gap-4">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.accent}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-semibold">
                      {stat.value.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stat.helper}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section>
          <MainAdmin />
        </section>
      </div>
    </div>
  );
}
