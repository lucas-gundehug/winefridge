"use client";

import { usePathname } from "next/navigation";

export function AppHeader() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <header className="sticky top-0 z-40 bg-[#120e0b] px-4 py-2 pt-[max(0.45rem,env(safe-area-inset-top,0px))] shadow-[0_10px_0_#120e0b]">
      <p className="truncate font-[family-name:var(--font-display)] text-sm leading-tight text-[var(--brass)]">
        Bossen(Anders) virtuelle vinkøleskab
      </p>
    </header>
  );
}
