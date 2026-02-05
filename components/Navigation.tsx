"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navigation({
  isRTL,
  translations,
}: {
  isRTL: boolean;
  translations: {
    transcript: string;
    mp3: string;
  };
}) {
  const pathname = usePathname();

  const links: Array<{ href: string; label: string }> = [
    { href: "/", label: translations.transcript },
    { href: "/mp3", label: translations.mp3 },
  ];

  return (
    <nav
      className={`mb-8 flex flex-wrap items-center gap-2 ${isRTL ? "justify-end" : "justify-start"}`}
      aria-label="Primary"
    >
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
              active
                ? "bg-red-500 border-red-500 text-white"
                : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
