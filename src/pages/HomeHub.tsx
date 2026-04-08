export function HomeHub() {
  return (
    <div className="flex flex-1 flex-col justify-center bg-neutral-50 px-6 pb-12 pt-4 sm:px-10 sm:pb-16 sm:pt-6">
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-[clamp(1.65rem,4.2vw,2.35rem)] font-semibold tracking-tight text-neutral-900">
          Welcome
        </h1>
        <p className="mt-4 text-[clamp(0.9rem,2.1vw,1.05rem)] leading-relaxed text-neutral-600">
          Pick a destination from the navigation above — live data, the race calendar, or the Cars
          grid.
        </p>
      </div>
    </div>
  );
}
