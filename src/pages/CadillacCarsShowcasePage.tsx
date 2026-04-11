import { Link } from 'react-router-dom';

const CADILLAC_HERO =
  'https://media.formula1.com/image/upload/t_16by9Centre/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/Cadillac/CadillacF1Team_2202_HiResEdit.webp';

const CADILLAC_STRIP_FIRST_IMG =
  'https://www.cadillacf1team.com/ctfassets/images/123jt18lixwc/6Sq0yL24jhWgKadGZKr5X3/20bb8d38f0a79de90be4de4a2477b53f/Image_Module_5.jpg?fm=avif&w=1920';

const CADILLAC_MODULE_4 =
  'https://www.cadillacf1team.com/ctfassets/images/123jt18lixwc/71Btd8srHM7PghcGrqQkVI/288435fa334cc06860a4125f228e2375/Image_Module_4.jpg?fm=avif&w=1920';

const CADILLAC_ANNOUNCEMENT_IMG =
  'https://media.formula1.com/image/upload/t_16by9North/c_lfill,w_3392/q_auto/v1740000001/fom-website/2025/Cadillac%20(GM)/TWGMS-F1-Announcement-1298%20(1)%20(1).webp';

const CADILLAC_SLIDE_MIAMI_IMG =
  'https://www.cadillacf1team.com/ctfassets/images/123jt18lixwc/2mBUUhnfOWQ0u07Wiqnl6F/f5e9b86abaf05c1eca665aa1e0f69a28/19.Miami_International_Autodrome_-_USA.001.png?fm=avif&w=1920';

const CADILLAC_JAPAN_BAND_IMG =
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/Japan/16x9%20single%20image%20-%202026-04-01T162650.157.webp';

type ShowcaseItem = {
  label: string;
  caption: string;
  image: string;
};

const CARS: ShowcaseItem[] = [
  {
    label: 'MAC-26 — hero',
    caption: 'Cadillac F1 Team challenger — launch photography.',
    image: CADILLAC_HERO,
  },
  {
    label: 'Studio strip',
    caption: 'Team imagery from the white-strip gallery sequence.',
    image: CADILLAC_STRIP_FIRST_IMG,
  },
  {
    label: 'Module detail',
    caption: 'Bodywork and livery from the programme reveal.',
    image: CADILLAC_MODULE_4,
  },
  {
    label: 'Drivers announcement',
    caption: 'Valtteri Bottas and Sergio Pérez with the Cadillac F1 programme.',
    image: CADILLAC_ANNOUNCEMENT_IMG,
  },
  {
    label: 'Miami International Autodrome',
    caption: 'Track map — home of the Miami Grand Prix.',
    image: CADILLAC_SLIDE_MIAMI_IMG,
  },
  {
    label: 'Race weekend',
    caption: 'Cadillac Formula 1 — Japan Grand Prix imagery.',
    image: CADILLAC_JAPAN_BAND_IMG,
  },
];

export function CadillacCarsShowcasePage() {
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
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" aria-hidden />
          <div className="relative z-10 flex min-h-[min(52vh,520px)] flex-col px-6 pb-10 pt-[max(0.75rem,env(safe-area-inset-top))] md:min-h-[min(60vh,640px)] md:px-10 md:pb-14">
            <Link
              to="/cars/cadillac"
              className="inline-flex w-fit items-center gap-2 text-[13px] font-medium text-white/85 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <span aria-hidden className="text-lg leading-none">
                ←
              </span>
              Brand experience
            </Link>
            <div className="mt-auto max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.36em] text-white/55">Cadillac F1</p>
              <h1 className="mt-3 text-[clamp(1.85rem,5.5vw,3rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-white [text-shadow:0_2px_32px_rgba(0,0,0,0.6)]">
                MAC-26
              </h1>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/75">
                Press and programme photography of Cadillac’s Formula 1 car and key moments from the 2026 season
                launch.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        className="w-full border-t border-white/[0.08] px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-12 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:px-8 md:px-10"
        aria-label="Cadillac MAC-26 showcase"
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
                  <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">{car.label}</h2>
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
            to="/cars/team/cadillac"
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
