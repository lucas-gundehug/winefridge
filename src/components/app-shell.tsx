import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-1 flex-col overflow-x-clip">
      <AppHeader />

      <main className="flex flex-1 flex-col px-4 pt-3 pb-[calc(5.4rem+env(safe-area-inset-bottom,0px))]">
        {children}
      </main>

      <Suspense fallback={<div className="h-16" />}>
        <BottomNav />
      </Suspense>
    </div>
  );
}
