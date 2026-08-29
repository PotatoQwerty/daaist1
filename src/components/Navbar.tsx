"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePathname } from "next/navigation";
import {
  Menu,
  User,
  LogOut,
  LayoutDashboard,
  Home,
  Book,
  Building,
  Library,
  School,
  Plus,
  PenTool,
  QrCode,
} from "lucide-react";
import DaaistLogoHor from "../../public/images/DAAIST-LOGO-HOR.svg";
import DaaistLogoHorDark from "../../public/images/daalogodarkhor.svg";
import { ThemeSwitch } from "./ThemeSwitch";
import { useUser } from "@/context/user-context";
import { canAdminister, canUploadResources } from "@/lib/roles";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ImageSkeleton from "./ImageSkeleton";

const NAV_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/courses", label: "Courses", icon: Book },
  { href: "/projects", label: "Projects", icon: Building },
  { href: "/club", label: "Clubs", icon: School },
  { href: "/docs", label: "Documents", icon: Library },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading, session, roles } = useUser();
  const canUpload = canUploadResources(roles);
  const showAdminDashboard = canAdminister(roles);
  const supabase = createClient();

  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname?.startsWith(href + "/") || pathname === href;

  const handleSignOut = async () => {
    const res = await supabase.auth.signOut();
    if (res.error) {
      console.error("Error signing out:", res.error.message);
    }
    window.location.href = "/";
  };

  const handleSignIn = async () => {
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?redirect_to=/`,
      },
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background">
      {/* The mark's three lenses plus its dot, run as a rule across the
          full width. The brand reads as structure rather than as a logo
          parked in a corner. */}
      <div className="brand-band" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

      <nav
        aria-label="Main"
        className="rule-b mx-auto flex h-[68px] w-full max-w-[1400px] items-center justify-between gap-6 px-4 sm:px-6"
      >
        <Link
          href="/"
          className="shrink-0 opacity-95 transition-opacity duration-200 hover:opacity-100"
        >
          <Image
            src={DaaistLogoHor}
            width={128}
            alt="Daa'ist"
            priority
            className="dark:hidden"
          />
          <Image
            src={DaaistLogoHorDark}
            width={128}
            alt=""
            aria-hidden="true"
            priority
            className="hidden dark:block"
          />
        </Link>

        {/* Desktop links. Text only: the icons duplicated the labels and
            crowded the row. Active state is a colour change plus a rule
            underneath, so navigating never shifts the layout. */}
        <div className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                prefetch={false}
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`relative py-2 text-[15px] transition-colors duration-200 ${
                  active
                    ? "font-bold text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
                {active && (
                  <span className="absolute inset-x-0 -bottom-px h-[3px] bg-accent" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <ThemeSwitch />

          {canUpload && (
            <Link
              href="/upload"
              className="hidden items-center gap-1.5 rounded-md bg-accent px-3 py-2 text-sm font-bold text-accent-foreground transition-transform duration-150 hover:brightness-110 active:scale-[0.98] md:inline-flex"
            >
              <Plus className="size-4" strokeWidth={2.5} />
              Upload
            </Link>
          )}

          {loading ? (
            <div
              title="Loading"
              className="size-9 overflow-hidden rounded-full border border-border bg-muted"
            >
              <ImageSkeleton />
            </div>
          ) : session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  title="Account menu"
                  type="button"
                  className="relative size-9 overflow-hidden rounded-full border border-border transition-colors hover:border-accent"
                >
                  <Image
                    src={
                      user?.image ||
                      session?.user?.user_metadata?.avatar_url ||
                      "/images/placeholder.png"
                    }
                    alt="Your profile"
                    sizes="36px"
                    fill
                    className="object-cover"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 rounded-lg">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm leading-none font-bold">
                      {user?.firstname && user?.lastname
                        ? `${user.firstname} ${user.lastname}`
                        : user?.name ||
                          session?.user?.user_metadata?.name ||
                          session?.user?.email}
                    </p>
                    <p className="truncate text-xs leading-none text-muted-foreground">
                      {user?.email || session?.user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 size-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/register" className="cursor-pointer">
                    <QrCode className="mr-2 size-4" />
                    <span>My event passes</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/tools" className="cursor-pointer">
                    <PenTool className="mr-2 size-4" />
                    <span>Tools</span>
                  </Link>
                </DropdownMenuItem>
                {showAdminDashboard && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                      <LayoutDashboard className="mr-2 size-4" />
                      <span>Admin dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:bg-destructive focus:text-destructive-foreground"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 size-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              type="button"
              onClick={handleSignIn}
              className="rounded-md bg-accent px-4 py-2 text-sm font-bold text-accent-foreground transition-transform duration-150 hover:brightness-110 active:scale-[0.98]"
            >
              Sign in
            </button>
          )}

          <div className="md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  title="Open menu"
                  aria-label="Open menu"
                  className="p-2 text-foreground"
                >
                  <Menu size={22} />
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[min(84vw,320px)] border-l border-border bg-background p-0"
              >
                <div className="brand-band" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <SheetHeader className="rule-b px-5 py-4">
                  <SheetTitle className="text-left text-base">Menu</SheetTitle>
                </SheetHeader>

                <nav className="flex flex-col px-2 py-3">
                  {NAV_LINKS.map((link) => {
                    const Icon = link.icon;
                    const active = isActive(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-3 rounded-md px-3 py-3 text-base transition-colors ${
                          active
                            ? "bg-subtle font-bold text-foreground"
                            : "text-muted-foreground hover:bg-subtle hover:text-foreground"
                        }`}
                      >
                        <Icon
                          className={`size-5 ${active ? "text-accent" : ""}`}
                          strokeWidth={1.75}
                        />
                        {link.label}
                      </Link>
                    );
                  })}
                </nav>

                <div className="rule-t mt-1 px-4 py-4">
                  {canUpload ? (
                    <Link
                      href="/upload"
                      onClick={() => setMobileOpen(false)}
                      className="flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-3 font-bold text-accent-foreground"
                    >
                      <Plus className="size-4" strokeWidth={2.5} />
                      Upload
                    </Link>
                  ) : null}

                  {!session && (
                    <button
                      type="button"
                      onClick={handleSignIn}
                      className="w-full rounded-md bg-accent px-4 py-3 font-bold text-accent-foreground"
                    >
                      Sign in
                    </button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
}
