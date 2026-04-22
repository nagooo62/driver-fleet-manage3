export function BrandWatermark() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-24 left-1/3 h-72 w-72 rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute bottom-16 right-16 h-64 w-64 rounded-full bg-accent/10 blur-[140px]" />
      <div className="absolute right-[-5rem] top-28 hidden xl:block font-display text-[10rem] leading-none text-white/[0.035]">
        روائس
      </div>
      <div className="absolute right-16 top-24 hidden items-center gap-3 rounded-full border border-white/6 bg-white/[0.02] px-5 py-3 text-white/30 backdrop-blur-2xl xl:flex">
        <span className="logo-glow h-3 w-3 rounded-full bg-primary/70" />
        <span className="text-sm">Rawaes Logistics</span>
      </div>
    </div>
  );
}
