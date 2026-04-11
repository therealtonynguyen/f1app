import { Link, Navigate, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';

/** Same duo frame as Audi brand page — consistent team imagery */
const AUDI_DUO_HERO =
  'https://cdn-1.motorsport.com/static/img/news/711491.webp';

type DriverConfig = {
  name: string;
  heroSrc: string;
};

const AUDI_DRIVERS: Record<string, DriverConfig> = {
  'nico-hulkenberg': {
    name: 'Nico Hulkenberg',
    heroSrc: AUDI_DUO_HERO,
  },
  'gabriel-bortoleto': {
    name: 'Gabriel Bortoleto',
    heroSrc: AUDI_DUO_HERO,
  },
};

export function AudiDriverPage() {
  const { driverSlug } = useParams<{ driverSlug: string }>();
  const slug = driverSlug?.toLowerCase() ?? '';
  const driver = AUDI_DRIVERS[slug];

  if (!driver) {
    return <Navigate to="/cars/audi" replace />;
  }

  const isGabriel = slug === 'gabriel-bortoleto';

  return (
    <div
      className={cn(
        'relative isolate flex min-h-0 flex-1 flex-col',
        isGabriel ? 'bg-white text-neutral-900' : 'bg-black text-white'
      )}
      style={{ fontFamily: 'var(--ios-font)' }}
    >
      <section className="relative min-h-[100dvh] w-full">
        {isGabriel ? (
          <div className="absolute inset-0 bg-white" aria-hidden />
        ) : (
          <>
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
          </>
        )}
        <div className="relative z-10 flex min-h-[100dvh] flex-col px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-10">
          <Link
            to="/cars/audi"
            className={cn(
              'mt-1 inline-flex w-fit items-center gap-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/90 focus-visible:ring-offset-2',
              isGabriel
                ? 'text-neutral-600 hover:text-neutral-900 focus-visible:ring-offset-white'
                : 'text-white/80 hover:text-white focus-visible:ring-offset-black'
            )}
          >
            <span aria-hidden className="text-lg leading-none">
              ←
            </span>
            Audi in Formula 1
          </Link>
          {!isGabriel && (
            <div className="mt-auto flex flex-col items-start pb-6 sm:pb-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.36em] text-red-500/95">
                Audi Formula 1 Team
              </p>
              <h1 className="mt-3 max-w-3xl text-[clamp(1.75rem,5.5vw,3rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-white [text-shadow:0_2px_28px_rgba(0,0,0,0.55)]">
                {driver.name}
              </h1>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
