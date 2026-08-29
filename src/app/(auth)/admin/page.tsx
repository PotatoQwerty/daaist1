import { notFound } from "next/navigation";
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

  // Dense metric surface: no card boxes, no icons in tinted circles.
  // Hairlines separate the numbers and the numbers are set in the mono
  // face with tabular figures, so columns of digits line up.
  const stats = [
    { label: "Users", value: usersCount, helper: "Registered profiles" },
    { label: "Files", value: filesCount, helper: "Uploads stored" },
    { label: "Favorites", value: likesCount, helper: "Total likes" },
    { label: "Clubs", value: clubsCount, helper: `${activeClubsCount} active` },
    {
      label: "Club members",
      value: clubMembersCount,
      helper: "Memberships",
    },
    {
      label: "Pending invites",
      value: pendingInvitesCount,
      helper: "Awaiting signup",
    },
  ];

  return (
    <div className="w-full bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <header className="rule-b pb-8">
          <div className="h-1 w-16 bg-foreground" aria-hidden="true" />
          <h1 className="mt-6 text-3xl font-bold md:text-4xl">
            Admin dashboard
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Current totals across Daa&apos;ist.
          </p>
        </header>

        <section className="grid grid-cols-2 gap-px bg-rule md:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-background px-5 py-7">
              <p className="annot">{stat.label}</p>
              <p className="mt-2 font-mono text-3xl font-medium tabular-nums md:text-4xl">
                {stat.value.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {stat.helper}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-12">
          <MainAdmin />
        </section>
      </div>
    </div>
  );
}
