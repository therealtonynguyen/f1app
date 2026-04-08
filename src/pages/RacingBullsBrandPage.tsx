import { Link } from 'react-router-dom';

/** FOM — Racing Bulls (VCARB) 2026 — 16×9 */
const HERO_IMG =
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/Racing%20Bulls%20(VCARB)/16x9%20single%20image%20(17).webp';

const HIGHLIGHTS: readonly { title: string; subtitle: string; image: string }[] = [
  {
    title: 'The livery',
    subtitle: 'White, Visa & Cash App — Detroit launch energy.',
    image: HERO_IMG,
  },
  {
    title: 'On track',
    subtitle: 'VCARB 03 · Faenza-built, Ford-powered.',
    image: HERO_IMG,
  },
];

/** Team landing — full-bleed hero, highlight cards, chassis link. */
export function RacingBullsBrandPage() {
  return (
    <div
      className="relative -mt-[var(--app-top-nav-offset)] flex min-h-0 flex-1 flex-col bg-[#060910] text-white"
      style={{ fontFamily: 'var(--ios-font)' }}
    >
      {/* Hero — full-bleed image only */}
      <section className="relative min-h-[min(100dvh,960px)] w-full overflow-hidden">
        <img
          src={HERO_IMG}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
        />
      </section>

      {/* Highlights — two-up cards (hub-style) */}
      <section className="border-t border-white/[0.08] px-6 py-20 sm:px-10 md:px-14 lg:px-20">
        <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-white/40">Highlights</p>
        <h2 className="mt-3 text-[clamp(1.5rem,3.5vw,2.25rem)] font-semibold tracking-tight text-white">
          Latest from the team
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10 lg:gap-12">
          {HIGHLIGHTS.map((h) => (
            <article
              key={h.title}
              className="group overflow-hidden border border-white/[0.08] bg-[#0c1220] transition-colors hover:border-white/[0.14]"
            >
              <div className="aspect-[16/9] w-full overflow-hidden bg-[#111827]">
                <img
                  src={h.image}
                  alt=""
                  className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="px-5 py-6 sm:px-6 sm:py-8">
                <h3 className="text-lg font-semibold tracking-tight text-white sm:text-xl">{h.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/55 sm:text-[15px]">{h.subtitle}</p>
                <span className="mt-5 inline-flex text-[12px] font-semibold uppercase tracking-[0.2em] text-white/35">
                  Explore →
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Closing */}
      <section className="border-t border-white/[0.08] px-6 py-20 text-center sm:px-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/35">Racing Bulls</p>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/50">
          Every generation — one chassis per season in the app.
        </p>
        <Link
          to="/cars/team/racing-bulls"
          className="mt-10 inline-flex rounded-full border border-white/20 bg-white/5 px-8 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-white/10"
        >
          Chassis history
        </Link>
      </section>

      <div className="h-[max(24px,env(safe-area-inset-bottom))] bg-[#060910]" aria-hidden />
    </div>
  );
}
