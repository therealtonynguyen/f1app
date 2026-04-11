import { Link } from 'react-router-dom';

const MERCEDES_TEAL = '#00D2BE';

type ShowcaseCar = {
  year: number;
  chassis: string;
  caption: string;
  image: string;
};

/** FOM / official imagery — same sources as brand & generations pages */
const CARS: ShowcaseCar[] = [
  {
    year: 2026,
    chassis: 'W17',
    caption: 'Current challenger — AMG F1 W17 E PERFORMANCE.',
    image:
      'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/Mercedes/Mercedes-AMG%20F1%20W17%20E%20PERFORMANCE%20-%20GR%204.webp',
  },
  {
    year: 2025,
    chassis: 'W16',
    caption: 'Silver Arrows livery evolution into the new regulations era.',
    image:
      'https://media.formula1.com/image/upload/t_16by9Centre/c_lfill,w_3392/q_auto/v1740000001/fom-website/2025/Mercedes/Formula%201%20header%20templates%20-%202025-02-24T142006.923.webp',
  },
  {
    year: 2024,
    chassis: 'W15 E PERFORMANCE',
    caption: 'Launch spec — front-quarter studio shot.',
    image:
      'https://media.formula1.com/image/upload/t_16by9Centre/c_lfill,w_3392/q_auto/v1740000001/fom-website/2023/Mercedes/W15%20launch/Mercedes-AMG%20W15%20E%20PERFORMANCE%20-%20Lewis%20Hamilton%20-%20Front%20Quarter.webp',
  },
  {
    year: 2022,
    chassis: 'W13',
    caption: 'Ground-effect return — overhead technical view.',
    image:
      'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/content/dam/fom-website/manual/Misc/2022manual/WinterFebruary/Mercedes/06_W13_Overhead_GR_AKK.webp',
  },
  {
    year: 2019,
    chassis: 'W10 EQ Power+',
    caption: 'Sixth consecutive constructors’ title campaign.',
    image:
      'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/content/dam/fom-website/sutton/2019/Germany/Thursday/1017625067-LAT-20190725-_L5R7567.webp',
  },
  {
    year: 2010,
    chassis: 'MGP W01',
    caption: 'Brackley’s return as a works team — the modern Silver Arrows era opens.',
    image:
      'https://static.wikia.nocookie.net/f1wikia/images/8/88/Mgp_w01.jpg/revision/latest?cb=20100619053930',
  },
];

export function MercedesCarsShowcasePage() {
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
              to="/cars/mercedes"
              className="inline-flex w-fit items-center gap-2 text-[13px] font-medium text-white/85 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D2BE] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <span aria-hidden className="text-lg leading-none">
                ←
              </span>
              Brand experience
            </Link>
            <div className="mt-auto max-w-3xl">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.36em]"
                style={{ color: MERCEDES_TEAL }}
              >
                Mercedes-AMG Petronas Formula One™ Team
              </p>
              <h1 className="mt-3 text-[clamp(1.85rem,5.5vw,3rem)] font-light leading-[1.08] tracking-[-0.02em] text-white [text-shadow:0_2px_32px_rgba(0,0,0,0.6)]">
                The cars
              </h1>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/75">
                A spotlight on Silver Arrows machinery — from the first Brackley car to today’s W17.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        className="w-full border-t border-white/[0.08] px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-12 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:px-8 md:px-10"
        aria-label="Mercedes F1 cars showcase"
      >
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {CARS.map((car) => (
            <article
              key={`${car.year}-${car.chassis}`}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={car.image}
                  alt=""
                  className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  loading="lazy"
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
                  <h2 className="mt-1 text-lg font-semibold tracking-tight text-white sm:text-xl">
                    {car.chassis}
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
          For every season’s chassis in detail —{' '}
          <Link
            to="/cars/team/mercedes"
            className="font-medium underline decoration-white/20 underline-offset-4 transition-colors hover:text-white/55 hover:decoration-[#00D2BE]/80"
          >
            open car history
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
