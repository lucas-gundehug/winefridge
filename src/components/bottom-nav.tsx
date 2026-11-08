"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, Plus, Wine } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Køleskab", icon: Wine },
  { href: "/tilfoej", label: "Tilføj", icon: Plus },
  { href: "/historik", label: "Historik", icon: History },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-[color-mix(in_oklch,var(--background),black_18%)]/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs transition-colors",
                  active
                    ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
