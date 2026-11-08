import { Suspense } from "react";
import { BottomNav } from "@/components/bottom-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-[rgba(196,163,90,0.16)] bg-[rgba(18,14,11,0.82)] px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md">
        <p className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--brass)]">
          Winefridge
        </p>
        <p className="text-sm text-muted-foreground">
          Bossen(Anders) virtuelle vinkøleskab
        </p>
      </header>

      <main className="flex-1 px-4 py-5 pb-28">{children}</main>

      <Suspense fallback={<div className="h-16" />}>
        <BottomNav />
      </Suspense>
    </div>
  );
}
