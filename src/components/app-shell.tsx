import { Suspense } from "react";
import { BottomNav } from "@/components/bottom-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col overflow-x-clip">
      <header className="sticky top-0 z-40 border-b border-[rgba(196,163,90,0.2)] bg-[#120e0b] px-4 pb-2.5 pt-[max(0.55rem,env(safe-area-inset-top,0px))] shadow-[0_12px_0_#120e0b]">
        <p className="font-[family-name:var(--font-display)] text-[1.35rem] leading-none tracking-tight text-[var(--brass)]">
          Winefridge
        </p>
        <p className="mt-1 text-[0.8125rem] leading-snug text-muted-foreground">
          Bossen(Anders) virtuelle vinkøleskab
        </p>
      </header>

      <main className="flex-1 px-4 py-4 pb-[calc(5.4rem+env(safe-area-inset-bottom,0px))]">
        {children}
      </main>

      <Suspense fallback={<div className="h-16" />}>
        <BottomNav />
      </Suspense>
    </div>
  );
}
