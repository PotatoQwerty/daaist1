"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
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
  PlusCircle,
} from "lucide-react";
import DaaistLogoHor from "../../public/images/DAAIST-LOGO-HOR.svg";
import DaaistLogoHorDark from "../../public/images/daalogodarkhor.svg";
import { ThemeSwitch } from "./ThemeSwitch";
import { useCurrentRole } from "@/hooks/use-current-role";
import {
  Sheet,
  SheetContent,
  SheetDescription,
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

const NAV_LINKS = [
  { href: "/", label: "Home", icon: <Home /> },
  { href: "/courses", label: "Courses", icon: <Book /> },
  { href: "/projects", label: "Projects", icon: <Building /> },
  { href: "/club", label: "Clubs", icon: <School /> },
  { href: "/docs", label: "Documents", icon: <Library /> },
];

export default function Navbar() {
  const { data: session } = useSession();
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();
  const role = useCurrentRole();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname?.startsWith(href + "/") || pathname === href;

  if (!mounted) return null;

  return (
    <nav className="flex justify-between items-center w-full p-4 bg-background/60 backdrop-blur-xl border-b border-white/10 shadow-sm sticky top-0 left-0 right-0 z-50 supports-backdrop-filter:bg-background/60">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 hover:scale-110 transition duration-300 ease-in-out"
      >
        <Image
          src={resolvedTheme === "dark" ? DaaistLogoHorDark : DaaistLogoHor}
          width={150}
          alt="Daaist Logo"
          priority
        />
      </Link>

      {/* Desktop Links */}
      <div className="hidden md:flex items-center gap-8 text-sm">
        {NAV_LINKS.map((link) => (
          <Link
            prefetch={false}
            key={link.href}
            href={link.href}
            aria-current={isActive(link.href) ? "page" : undefined}
            className={`flex items-center gap-2 transition duration-300 ease-in-out ${
              isActive(link.href)
                ? "text-accent scale-125 text-lg font-extrabold"
                : "hover:text-accent hover:scale-105"
            }`}
          >
            {link.icon}
            {link.label}
          </Link>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <ThemeSwitch />

        {/* Admin Upload */}
        {role === "admin" && (
          <Link
            href="/upload"
            className="hidden md:flex items-center justify-center gap-1 bg-accent text-white rounded-sm p-2 hover:bg-secondary transition duration-300"
          >
            <PlusCircle className="mr-1 h-4 w-4" />
            Upload
          </Link>
        )}

        {/* Session / Profile */}
        {session ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                title="Menu"
                type="button"
                className="relative w-9 h-9 rounded-full overflow-hidden border border-border hover:ring-2 hover:ring-ring transition-all focus:outline-none"
              >
                <Image
                  src={session.user.image || "/images/placeholder.png"}
                  alt="Profile"
                  sizes="36px"
                  fill
                  className="object-cover"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {session.user.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session.user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              {role === "admin" && (
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Admin Dashboard</span>
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 cursor-pointer"
                onClick={() => signOut()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            type="button"
            onClick={() => signIn("google")}
            className="p-2 bg-accent rounded-lg hover:bg-primary/90 hover:text-white transition-all ease-in-out duration-150"
          >
            Sign In
          </button>
        )}

        {/* Mobile Dictionary */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                title="Menu"
                className="p-2 -mr-2 text-foreground/80 hover:text-foreground"
              >
                <Menu size={24} />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[200px] sm:w-[250px] p-2 flex flex-col items-center bg-background/60 backdrop-blur-xl border-white/10 shadow-sm supports-backdrop-filter:bg-background/60"
            >
              <SheetDescription aria-description="Menu" />
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2 mt-8 items-start">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items&-center gap-2 text-lg font-bold transition-colors ${
                      isActive(link.href)
                        ? "text-primary scale-115"
                        : "text-foreground/60 hover:text-foreground"
                    }`}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                ))}
                {role === "admin" && (
                  <Link
                    href="/upload"
                    className="flex items-center justify-center gap-1 text-lg font-bold hover:text-foreground bg-accent p-2 w-full rounded-lg text-white "
                  >
                    <PlusCircle className="mr-1 h-4 w-4" />
                    <span>Upload</span>
                  </Link>
                )}
                {!session && (
                  <button
                    onClick={() => signIn("google")}
                    className="text-lg font-medium text-left text-foreground/60 hover:text-foreground"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
