"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import DaaistLogoHor from "../../public/images/DAAIST-LOGO-HOR.svg";
import DaaistLogoHorDark from "../../public/images/daalogodarkhor.svg";
import PfpPlaceholder from "../../public/images/placeholder.png";
import { ThemeSwitch } from "./ThemeSwitch";
import { useCurrentRole } from "@/hooks/use-current-role";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/projects", label: "Projects" },
  { href: "/club", label: "Clubs" },
  { href: "/docs", label: "Documents" },
];

export default function Navbar() {
  const { data: session } = useSession();
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();
  const role = useCurrentRole();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname?.startsWith(href + "/") || pathname === href;

  if (!mounted) return null;

  return (
    <nav className="flex justify-between items-center w-full p-4 bg-background border-b-2 border-foreground uppercase font-bold tracking-wide">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 hover:scale-110 transition duration-300 ease-in-out"
      >
        <Image
          src={resolvedTheme === "dark" ? DaaistLogoHorDark : DaaistLogoHor}
          width={150}
          height={100}
          alt="Daaist Logo"
        />
      </Link>

      {/* Desktop Links */}
      <div className="hidden md:flex items-center gap-8 text-sm">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive(link.href) ? "page" : undefined}
            className={`transition duration-300 ease-in-out ${
              isActive(link.href)
                ? "text-accent scale-125 text-lg font-extrabold"
                : "hover:text-accent hover:scale-105"
            }`}
          >
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
            + Upload
          </Link>
        )}

        {/* Session / Profile */}
        {session ? (
          <div className="relative">
            <div
              className="flex items-center gap-1 cursor-pointer group"
              onClick={() => setProfileOpen((prev) => !prev)}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border border-accent">
                <Image
                  src={session.user.image || PfpPlaceholder}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="object-cover w-full h-full"
                />
              </div>
              <span className="hidden md:block uppercase font-bold">
                {session.user.name?.split(" ")[0]}
              </span>
            </div>

            {/* Dropdown */}
            <div
              className={`absolute right-0 mt-2 w-40 bg-background border rounded-md shadow-lg flex-col z-50 transition-all duration-200 ${
                profileOpen ? "flex" : "hidden"
              } md:group-hover:flex`}
            >
              <Link
                href="/profile"
                className="p-2 hover:bg-accent/10 transition-colors capitalize"
              >
                Profile
              </Link>
              {role === "admin" && (
                <Link
                  href="/admin"
                  className="p-2 hover:bg-accent/10 transition-colors capitalize"
                >
                  Admin dashboard
                </Link>
              )}
              <button
                onClick={() => signOut()}
                className="p-2 hover:bg-red-500 hover:text-white rounded-md text-left transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => signIn("google")}
            className="p-2 bg-accent rounded-lg hover:bg-primary/90 hover:text-white transition-all ease-in-out duration-150"
          >
            Sign In
          </button>
        )}

        {/* Mobile Hamburger */}
        <div className="md:hidden relative">
          <Menu
            size={24}
            className={`transition-transform duration-300 ${
              mobileOpen ? "rotate-90 text-accent" : "rotate-0"
            }`}
            onClick={() => setMobileOpen((prev) => !prev)}
          />

          {mobileOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/10 backdrop-blur-xs z-40"
                onClick={() => setMobileOpen(false)}
              />
              {/* Dropdown */}
              <div className="absolute top-16 right-1 z-50 bg-background border border-foreground rounded-md shadow-lg flex flex-col p-4 gap-4">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive(link.href) ? "page" : undefined}
                    className={`transition duration-300 ease-in-out ${
                      isActive(link.href)
                        ? "text-accent scale-110 text-lg font-extrabold"
                        : ""
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
