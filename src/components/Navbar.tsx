"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";
import { signIn, signOut, useSession } from "next-auth/react";
import DaaistLogoHor from "../../public/images/DAAIST-LOGO-HOR.svg";
import DaaistLogoHorDark from "../../public/images/daalogodarkhor.svg";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";

function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [usedTheme, setUsedTheme] = useState(resolvedTheme || null);
  // const [menuOpen, setMenuOpen] = useState(false);  add the functionality for mobile later
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) {
    // Return a placeholder or `null` to avoid rendering anything on the server
    return null;
  }

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
            src={theme === "dark" ? DaaistLogoHorDark : DaaistLogoHor}
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
                  : "hover:text-accent hover:scale-115"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* RIGHT: Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setTheme((e) => (e == "dark" ? "light" : "dark"))}
          aria-label="Toggle dark mode"
          className="p-1"
        >
          {theme == "dark" ? <Sun /> : <Moon />}
        </button>
        {session?.user ? (
          <>
            <Link
              href="/upload"
              className="bg-primary text-white px-4 py-2 hover:bg-accent transition"
            >
              + Upload
            </Link>
            <div className="dropdown">
              <div className="relative inline-block">
                <div className="dropdown-content">
                  <button onClick={() => signOut()}>Sign Out</button>
                </div>
              </div>
              <Link href="/profile" className="hover:text-accent">
                Profile
              </Link>
            </div>
          </>
        ) : (
          <button
            onClick={() => signIn("google")}
            className="p-2 bg-accent font-bold text-background hover:bg-accent/80 hover:text-white"
          >
            Log In
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
