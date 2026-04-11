import { Link } from 'react-router-dom';

/** Apple/SF stack — matches Audi brand page headline */
const AUDI_HEADLINE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

type ShowcaseCar = {
  year: number;
  label: string;
  caption: string;
  image: string;
};

/** Official / press imagery — aligned with Audi brand page */
const CARS: ShowcaseCar[] = [
  {
    year: 2026,
    label: 'Formula 1 show car',
    caption: 'Side profile — Audi’s F1 challenger presentation livery.',
    image:
      'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/common/f1/2026/audi/2026audicarright.webp',
  },
  {
    year: 2026,
    label: 'Neckhausen reveal',
    caption: 'Trackside imagery from the team’s launch programme.',
    image:
      'https://uploads.audi-mediacenter.com/system/production/media/129036/images/798075a49be83d682dbc49c8528f9c6b9164fa06/A251836_web_1920.jpg?1763019513',
  },
  {
    year: 2026,
    label: 'Studio hero',
    caption: 'Full-width studio shot — proportions and aero philosophy.',
    image:
      'https://uploads.audi-mediacenter.com/system/production/media/129041/images/ef358db8e148c1f516a58f9f1beaa2a1aaa21a7f/A251841_web_1920.jpg?1763024903',
  },
  {
    year: 2026,
    label: 'Design unveil',
    caption: 'Audi unveils its Formula 1 design direction — headline moment.',
    image:
      'https://uploads.audi-mediacenter.com/system/production/media/129017/images/4c4f51507253419425a628e3dc2fc30160e9d6a0/A251817_web_1920.jpg?1762964888',
  },
  {
    year: 2026,
    label: 'Technical detail',
    caption: 'Close-up — engineering and partnership storytelling.',
    image:
      'https://uploads.audi-mediacenter.com/system/production/media/129006/images/df3adc386158e88fb6f8fa6eedd0f2be1f750a2e/A251806_web_1920.jpg?1762965393',
  },
];

export function AudiCarsShowcasePage() {
  return (
    <div
      className="relative isolate flex min-h-0 flex-1 flex-col bg-black text-white"
      style={{ fontFamily: 'var(--ios-font)' }}
    >
      <section className="relative w-full">
        <div className="relative min-h-[min(52vh,520px)] w-full overflow-hidden md:min-h-[min(60vh,640px)]">
          <img
            src={CARS[0].image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20"
            aria-hidden
          />
          <div className="relative z-10 flex min-h-[min(52vh,520px)] flex-col px-6 pb-10 pt-[max(0.75rem,env(safe-area-inset-top))] md:min-h-[min(60vh,640px)] md:px-10 md:pb-14">
            <Link
              to="/cars/audi"
              className="inline-flex w-fit items-center gap-2 text-[13px] font-medium text-white/85 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <span aria-hidden className="text-lg leading-none">
                ←
              </span>
              Brand experience
            </Link>
            <div className="mt-auto max-w-3xl">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.36em] text-white/55"
                style={{ fontFamily: AUDI_HEADLINE_FONT }}
              >
                Audi in Formula 1
              </p>
              <h1
                className="mt-3 text-[clamp(1.85rem,5.5vw,3rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-white [text-shadow:0_2px_32px_rgba(0,0,0,0.6)]"
                style={{ fontFamily: AUDI_HEADLINE_FONT }}
              >
                The cars
              </h1>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/75">
                Show car, studio, and launch photography from Audi’s Formula 1 programme.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        className="w-full border-t border-white/[0.08] px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-12 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:px-8 md:px-10"
        aria-label="Audi F1 cars showcase"
      >
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {CARS.map((car, idx) => (
            <article
              key={`${car.label}-${idx}`}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={car.image}
                  alt=""
                  className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90"
                  aria-hidden
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/50">
                    {car.year}
                  </p>
                  <h2
                    className="mt-1 text-lg font-semibold tracking-tight text-white sm:text-xl"
                    style={{ fontFamily: AUDI_HEADLINE_FONT }}
                  >
                    {car.label}
                  </h2>
                </div>
              </div>
              <p className="border-t border-white/[0.06] px-4 py-3 text-[13px] leading-relaxed text-white/45 sm:px-5 sm:py-4">
                {car.caption}
              </p>
            </article>
          ))}
        </div>

        <p className="mx-auto mt-12 max-w-2xl text-center text-[13px] leading-relaxed text-white/35">
          Season-by-season chassis articles —{' '}
          <Link
            to="/cars/team/audi"
            className="font-medium underline decoration-white/20 underline-offset-4 transition-colors hover:text-white/55 hover:decoration-white/40"
          >
            open car history
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
