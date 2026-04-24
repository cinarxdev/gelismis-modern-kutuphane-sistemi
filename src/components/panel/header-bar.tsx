"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Moon, Sun, Monitor } from "lucide-react";

export function HeaderBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--card-border)] bg-[var(--background)]/80 px-6 backdrop-blur-md">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-semibold tracking-tight text-[var(--foreground)]"
        >
          {title}
        </motion.h1>
        {subtitle && <p className="text-sm text-[var(--muted)]">{subtitle}</p>}
      </div>
      <div className="ms-auto flex items-center gap-2">
        {mounted && (
          <div className="flex rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-1">
            <button
              type="button"
              aria-label="Açık tema"
              onClick={() => setTheme("light")}
              className={`rounded-lg p-2 ${theme === "light" ? "bg-[var(--accent)] text-white" : "text-[var(--muted)]"}`}
            >
              <Sun className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Koyu tema"
              onClick={() => setTheme("dark")}
              className={`rounded-lg p-2 ${theme === "dark" ? "bg-[var(--accent)] text-white" : "text-[var(--muted)]"}`}
            >
              <Moon className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Sistem"
              onClick={() => setTheme("system")}
              className={`rounded-lg p-2 ${theme === "system" ? "bg-[var(--accent)] text-white" : "text-[var(--muted)]"}`}
            >
              <Monitor className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
