"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";
import { signIn, signOut, useSession } from "next-auth/react";
import DaaistLogoHor from "../../public/images/DAAIST-LOGO-HOR.svg";
import DaaistLogoHorDark from "../../public/images/daalogodarkhor.svg";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { ThemeSwitch } from "./ThemeSwitch";
import { useCurrentRole } from "@/hooks/use-current-role";

function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [usedTheme, setUsedTheme] = useState<string | null>(null);
  const role = useCurrentRole();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (resolvedTheme) {
      setUsedTheme(resolvedTheme);
      console.log(resolvedTheme);
    }
  }, [resolvedTheme]);

  if (!mounted) return null;

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <nav className="w-full flex justify-between items-center border-b-4 border-foreground bg-background px-8 py-4 uppercase font-bold tracking-wide">
      {/* LEFT: Logo */}
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="hover:scale-110 transition duration-300 ease-in-out"
        >
          <Image
            src={usedTheme === "dark" ? DaaistLogoHorDark : DaaistLogoHor}
            height={100}
            width={150}
            alt="Daaist Logo"
          />
        </Link>
      </div>

      {/* CENTER: Links */}
      <div className="hidden md:flex items-center gap-8 text-sm">
        {[
          { href: "/", label: "Home" },
          { href: "/courses", label: "Courses" },
          { href: "/projects", label: "Projects" },
          { href: "/club", label: "Clubs" },
        ].map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              href={link.href}
              key={link.href}
              aria-current={active ? "page" : undefined}
              className={`transition duration-300 ease-in-out ${
                active
                  ? "text-accent scale-110 text-lg font-extrabold"
                  : "hover:text-accent hover:scale-105"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* RIGHT: Actions */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <ThemeSwitch />
        {session?.user ? (
          <>
            <Link
              href="/upload"
              className="bg-primary text-white px-4 py-2 hidden md:block hover:bg-accent transition rounded-md"
            >
              + Upload
            </Link>
            {/* Dropdown */}
            <div className="dropdown">
              <Link
                href="/profile"
                className="hover:text-accent flex items-center gap-2"
              >
                <Image
                  src={session.user.image || "/default-avatar.png"}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="rounded-full border border-foreground"
                />
                <span>{session.user.name?.split(" ")[0]}</span>
              </Link>

              {/* Dropdown Content */}
              <div className="dropdown-content">
                <Link
                  href="/profile"
                  className="block px-4 py-2 hover:bg-accent hover:text-background"
                >
                  Profile
                </Link>
                {role === "admin" || role === "club" ? (
                  <Link
                    href="/admin"
                    className="block px-4 py-2 hover:bg-accent hover:text-background"
                  >
                    Admin Dashboard
                  </Link>
                ) : null}
                <button
                  onClick={() => signOut()}
                  className="w-full text-left px-4 py-2 hover:bg-red-500 hover:text-white"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </>
        ) : (
          <button
            onClick={() => signIn("google")}
            className="p-2 bg-accent font-bold text-background hover:bg-accent/80 hover:text-white rounded-md"
          >
            Log In
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
