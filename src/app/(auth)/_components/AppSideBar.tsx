"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

import {
  FileCheck2,
  Home,
  LayoutDashboard,
  PartyPopper,
  User,
  Sun,
  Moon,
} from "lucide-react";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import DaaistLogo from "../../../../public/images/DAAIST-LOGO-HOR.svg";
import DaaistLogoDark from "../../../../public/images/daalogodarkhor.svg";

const items = [
  { title: "Home", link: "/", icon: Home },
  { title: "Admin Dashboard", link: "/admin", icon: LayoutDashboard },
  { title: "Manage Users", link: "/admin/manage/users", icon: User },
  { title: "Manage Events", link: "/admin/manage/events", icon: PartyPopper },
  { title: "Manage Posts", link: "/admin/manage/posts", icon: FileCheck2 },
];

export function AppSidebar() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <Sidebar className="flex flex-col h-screen bg-sidebar text-foreground">
      {/* Logo */}
      <SidebarHeader className="flex justify-center py-4">
        <Link href="/">
          <Image
            src={theme === "dark" ? DaaistLogoDark : DaaistLogo}
            alt="Daaist logo"
            loading="eager"
            className="w-36 sm:w-44 hover:scale-105 transition-transform duration-200"
          />
        </Link>
      </SidebarHeader>

      {/* Menu */}
      <SidebarContent className="flex-1">
        <SidebarGroup>
          <SidebarGroupLabel>Admin Layout</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname === item.link;
                return (
                  <SidebarMenuItem
                    key={item.title}
                    className={`rounded-md ${
                      active
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/10"
                    }`}
                  >
                    <SidebarMenuButton asChild>
                      <Link
                        href={item.link}
                        className="flex items-center gap-2 px-2 py-1"
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer / Theme Toggle */}
      <SidebarFooter className="py-4 flex justify-center">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent/10 transition-colors"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
          <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
