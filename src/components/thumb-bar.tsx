export function ThumbBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 z-30 bg-gradient-to-t from-[#120e0b] from-55% to-transparent px-4 pt-4 pb-2 [bottom:calc(4.65rem+env(safe-area-inset-bottom,0px))]">
      <div className="pointer-events-auto mx-auto w-full max-w-lg">{children}</div>
    </div>
  );
}
