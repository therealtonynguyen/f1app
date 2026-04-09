import { Link, Navigate, useParams } from 'react-router-dom';

const MERCEDES_TEAL = '#00D2BE';

type DriverConfig = {
  name: string;
  heroSrc: string;
};

const MERCEDES_DRIVERS: Record<string, DriverConfig> = {
  'george-russell': {
    name: 'George Russell',
    heroSrc:
      'https://cdn-4.motorsport.com/images/amp/24vxlOe6/s1200/george-russell-mercedes-andrea-2.webp',
  },
  'kimi-antonelli': {
    name: 'Andrea Kimi Antonelli',
    heroSrc:
      'https://www.irishtimes.com/resizer/v2/D2SBMVF2PT5W54S5CEPEWIC5AY.jpg?auth=9ca2228d4a5186591127131e1ff53a3d7a13bda7849112e1d44486b4f9d56245&smart=true&width=1600&height=1067',
  },
};

export function MercedesDriverPage() {
  const { driverSlug } = useParams<{ driverSlug: string }>();
  const slug = driverSlug?.toLowerCase() ?? '';
  const driver = MERCEDES_DRIVERS[slug];

  if (!driver) {
    return <Navigate to="/cars/mercedes" replace />;
  }

  return (
    <div
      className="relative isolate flex min-h-0 flex-1 flex-col bg-black text-white"
      style={{ fontFamily: 'var(--ios-font)' }}
    >
      <section className="relative min-h-[100dvh] w-full">
        <div className="absolute inset-0 bg-black">
          <img
            src={driver.heroSrc}
            alt={driver.name}
            className="h-full w-full object-cover object-center"
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-black/85 via-black/25 to-black/30"
          aria-hidden
        />
        <div className="relative z-10 flex min-h-[100dvh] flex-col px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-10">
          <Link
            to="/cars/mercedes"
            className="mt-1 inline-flex w-fit items-center gap-2 text-[13px] font-medium text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D2BE] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <span aria-hidden className="text-lg leading-none">
              ←
            </span>
            Mercedes-AMG Petronas
          </Link>
          <div className="mt-auto flex flex-col items-start pb-6 sm:pb-10">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.36em]"
              style={{ color: `${MERCEDES_TEAL}` }}
            >
              Mercedes-AMG Petronas Formula One™ Team
            </p>
            <h1 className="mt-3 max-w-3xl text-[clamp(1.75rem,5.5vw,3rem)] font-light leading-[1.08] tracking-[-0.02em] text-white [text-shadow:0_2px_28px_rgba(0,0,0,0.55)]">
              {driver.name}
            </h1>
          </div>
        </div>
      </section>
    </div>
  );
}
