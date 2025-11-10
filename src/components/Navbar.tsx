"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";
import { signIn, signOut, useSession } from "next-auth/react";
import DaaistLogoHor from "../../public/images/DAAIST-LOGO-HOR.svg";
import DaaistLogoHorDark from "../../public/images/daalogodarkhor.svg";
import PfpPlaceholder from "../../public/images/placeholder.png";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { ThemeSwitch } from "./ThemeSwitch";
import { Menu } from "lucide-react";
import { useCurrentRole } from "@/hooks/use-current-role";

function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);
  const role = useCurrentRole();
  const links = [
    { href: "/", label: "Home" },
    { href: "/courses", label: "Courses" },
    { href: "/projects", label: "Projects" },
    { href: "/club", label: "Clubs" },
    { href: "/docs", label: "Documents" },
  ];
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const menu = document.getElementById("mobile-menu");
      const button = document.getElementById("menu-button");

      if (
        menu &&
        !menu.contains(event.target as Node) &&
        button &&
        !button.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener("click", handleClickOutside);
    }

    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen]);
  if (!mounted) return null;

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <nav className="w-full flex justify-between items-center border-b-2 border-foreground bg-background px-8 py-4 uppercase font-bold tracking-wide">
      {/* LEFT: Logo */}
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="hover:scale-110 transition duration-300 ease-in-out"
        >
          <Image
            src={resolvedTheme === "dark" ? DaaistLogoHorDark : DaaistLogoHor}
            height={100}
            width={150}
            alt="Daaist Logo"
          />
        </Link>
      </div>

      {/* CENTER: Links */}
      <div className="hidden md:flex items-center gap-8 text-sm">
        {links.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              href={link.href}
              key={link.href}
              aria-current={active ? "page" : undefined}
              className={`transition duration-300 ease-in-out ${
                active
                  ? "text-accent scale-125 text-lg font-extrabold"
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
        {/* { we want to display the hamburger menu} */}

        {session ? (
          <div className="relative group">
            <div className="flex gap-1 items-center justify-center cursor-pointer">
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

            <div className="absolute right-0 -mt-1 w-40 bg-background border rounded-md shadow-lg flex-col z-50 hidden group-hover:flex transition-all duration-200">
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
            className="p-2 bg-accent rounded-lg hover:bg-primary/90 hover:text-white transition-all ease-in-out duration-150"
            onClick={() => signIn("google")}
          >
            Sign In
          </button>
        )}
        {session && (
          <div className="md:hidden">
            <div className="md:hidden relative">
              <Menu
                size={24}
                id="menu-button"
                aria-label="Toggle menu"
                onClick={() => setIsOpen(!isOpen)}
                className={`transition-transform duration-300 ${
                  isOpen ? "rotate-90 text-accent" : "rotate-0"
                }`}
              />

              {isOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 bg-black/10 backdrop-blur-xs z-40"
                    onClick={() => setIsOpen(false)}
                  />

                  {/* Dropdown */}
                  <div
                    id="mobile-menu"
                    className="absolute top-16 right-1 z-50 bg-background border border-foreground rounded-md shadow-lg flex flex-col p-4 gap-4"
                  >
                    {links.map((link) => {
                      const active = isActive(link.href);
                      return (
                        <Link
                          href={link.href}
                          onClick={() => setIsOpen(false)}
                          key={link.href}
                          aria-current={active ? "page" : undefined}
                          className={`transition duration-300 ease-in-out ${
                            active
                              ? "text-accent scale-110 text-lg font-extrabold"
                              : ""
                          }`}
                        >
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
