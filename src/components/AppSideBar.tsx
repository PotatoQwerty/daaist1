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
const items = [
  {
    title: "Home",
    link: "/",
    icon: Home,
  },
  {
    title: "Admin Dashboard",
    link: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Manage Users",
    link: "/manage/users",
    icon: User,
  },
  {
    title: "Manage Events",
    link: "/manage/events",
    icon: PartyPopper,
  },
  {
    title: "Manage Posts",
    link: "/manage/posts",
    icon: FileCheck2,
  },
];
import DaaistLogo from "../../public/images/DAAIST-LOGO-HOR.svg";
import DaaistLogoDark from "../../public/images/daalogodarkhor.svg";
import { useTheme } from "next-themes";

export function AppSidebar() {
  const { theme, setTheme } = useTheme();
  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/">
          <Image
            src={theme == "dark" ? DaaistLogoDark : DaaistLogo}
            alt="Daaist logo"
            className="hover:scale-110 transition-all ease-in-out duration-200 self-center"
          />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Layout</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title} className="text-foreground">
                  <SidebarMenuButton asChild>
                    <Link href={item.link}>
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {theme == "dark" ? (
          <button
            className="flex justify-center items-center gap-1"
            onClick={() => setTheme("light")}
          >
            <Moon className="size-5" />
            <span>Set light mode</span>
          </button>
        ) : (
          <button
            className="flex justify-center items-center gap-1"
            onClick={() => setTheme("dark")}
          >
            <Sun className="size-5" />
            <span>Set dark mode</span>
          </button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
