"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export const ThemeSwitch = () => {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle dark or light mode"
      className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      {resolvedTheme === "dark" ? <Sun /> : <Moon />}
    </button>
  );
};
