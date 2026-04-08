import { Link } from 'react-router-dom';

const DRIVER_SQUAD_HERO =
  'https://assets.astonmartinf1.com/public/cms/60OTxBVnjCbNtkCwMjznpE/e8e3283b8014a2844698ab42c9224324/Driver_squad_hero.jpg?w=2880&h=1698&fit=thumb';

const AMR26_HERO =
  'https://media.formula1.com/image/upload/t_16by9Centre/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/Aston%20Martin/GD2_2384%20copy.webp';

const generationsGreen = {
  backgroundColor: '#06140f' as const,
  backgroundImage: [
    'radial-gradient(ellipse 100% 80% at 50% 0%, rgba(72, 195, 135, 0.22) 0%, transparent 50%)',
    'linear-gradient(180deg, rgba(6, 28, 18, 0.97) 0%, rgba(10, 48, 32, 0.92) 40%, rgba(4, 18, 12, 1) 100%)',
  ].join(', '),
};

const sectionInk = {
  backgroundColor: '#030806' as const,
  backgroundImage:
    'linear-gradient(180deg, rgba(4, 14, 10, 1) 0%, rgba(2, 8, 6, 1) 50%, rgba(4, 16, 11, 1) 100%)',
};

/** Large headline figures — framed as 2026 regulations / typical F1 performance (not team-tested lap data). */
const AMR26_HEADLINE_STATS: readonly {
  value: string;
  unit?: string;
  label: string;
  hint?: string;
}[] = [
  { value: '768', unit: 'kg', label: 'Minimum mass', hint: '2026 FIA technical regulations' },
  { value: '350', unit: 'kW', label: 'MGU-K ceiling', hint: 'Kinetic recovery & deployment (2026 regs)' },
  { value: '50:50', label: 'Hybrid balance', hint: 'Target split — ICE vs electrical (regulation philosophy)' },
  { value: '8', label: 'Forward speeds', hint: 'Mandatory semi-automatic gearbox (2026)' },
];

/** Speed highlight — typical F1 maximum (varies by circuit, aero setup, and conditions). */
const SPEED_KMH = '≈350';
const SPEED_MPH = '≈217';

const AMR26_SPEC_ROWS: readonly { label: string; value: string }[] = [
  { label: 'Designation', value: 'AMR26' },
  { label: 'Championship', value: 'FIA Formula One World Championship' },
  { label: 'Regulations', value: '2026 technical & sporting (chassis + power unit reset)' },
  { label: 'Power unit', value: 'Honda — works partnership from 2026' },
  { label: 'Development', value: 'AMR Technology Campus, Silverstone' },
  { label: 'Drivers', value: 'Fernando Alonso · Lance Stroll' },
];

const wideShell = 'mx-auto w-full max-w-[1200px] px-6 sm:px-8 lg:px-12';

/** Team landing — Aston-style performance figures + AMR26 imagery. */
export function AstonMartinBrandPage() {
  return (
    <div className="relative isolate flex min-h-0 flex-1 flex-col">
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-0"
        style={{ top: 'var(--app-top-nav-offset)' }}
        aria-hidden
      >
        <img
          src={DRIVER_SQUAD_HERO}
          alt=""
          className="h-full w-full object-cover object-[center_28%]"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />
      </div>

      <section
        className="relative z-10 flex min-h-[min(100dvh,920px)] flex-1 flex-col items-center justify-center gap-10 px-5 py-16 text-center sm:gap-12 md:gap-14 sm:px-8"
        style={{
          fontFamily: 'var(--ios-font)',
          ...generationsGreen,
        }}
      >
        <img
          src="/aston-martin-logo.png"
          alt="Aston Martin"
          className="w-[min(420px,90vw)] max-w-full shrink-0 object-contain brightness-0 invert opacity-[0.96] drop-shadow-[0_8px_40px_rgba(0,0,0,0.35)]"
          loading="eager"
          decoding="async"
        />
        <h1
          className="max-w-[min(100%,42rem)] font-black uppercase tracking-[0.06em] text-white"
          style={{
            fontSize: 'clamp(1.75rem, 6.5vw, 3.75rem)',
            lineHeight: 1.02,
            textShadow:
              '0 2px 24px rgba(0,0,0,0.45), 0 0 80px rgba(45, 140, 95, 0.35), 0 1px 0 rgba(255,255,255,0.12)',
          }}
        >
          <span className="block">Precision.</span>
          <span className="mt-[0.35em] block">Performance.</span>
          <span className="mt-[0.35em] block">Luxury.</span>
        </h1>
      </section>

      <div className="relative z-10 min-h-[min(100dvh,900px)] flex-1" aria-hidden />

      {/* AMR26 — title + hero image */}
      <section
        className="relative z-10 border-t border-white/[0.06] py-16 sm:py-24 md:py-28"
        style={{ fontFamily: 'var(--ios-font)', ...generationsGreen }}
      >
        <div className={wideShell}>
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.35em] text-emerald-200/45">
            Aston Martin Aramco · Formula One™
          </p>
          <h2 className="mt-3 text-center text-[clamp(2.75rem,9vw,5rem)] font-light tracking-[-0.04em] text-white">
            AMR26
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-[15px] font-normal leading-relaxed text-white/45 sm:text-[16px]">
            The 2026 challenger — engineered for the sport’s next regulatory era.
          </p>

          <div className="mt-12 overflow-hidden rounded-[1.5rem] bg-black/35 ring-1 ring-white/[0.07] sm:mt-16 sm:rounded-[2rem]">
            <img
              src={AMR26_HERO}
              alt="Aston Martin AMR26 Formula 1 car"
              className="aspect-[21/10] w-full object-cover object-[center_42%] sm:aspect-[2/1]"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* Performance — big numbers (Aston Martin site rhythm) */}
      <section
        className="relative z-10 border-t border-white/[0.06] py-16 sm:py-20"
        style={{ fontFamily: 'var(--ios-font)', ...sectionInk }}
      >
        <div className={wideShell}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-emerald-200/40">Performance</p>
          <h3 className="mt-2 text-[clamp(1.5rem,4vw,2rem)] font-light tracking-[-0.02em] text-white">
            2026 regulations at a glance
          </h3>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-white/38">
            Figures reference the FIA Formula 1 framework for 2026 — not team-specific test or race data.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 border-t border-white/[0.08] pt-12 md:grid-cols-4 md:gap-y-0 md:pt-14">
            {AMR26_HEADLINE_STATS.map((s, i) => (
              <div
                key={s.label}
                className={[
                  i > 0 ? 'md:border-l md:border-white/[0.08] md:pl-8 lg:pl-10' : '',
                  i >= 2 ? 'border-t border-white/[0.08] pt-10 md:border-t-0 md:pt-0' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className="flex flex-wrap items-baseline gap-1.5">
                  <span className="text-[clamp(2.25rem,6vw,3.75rem)] font-extralight tabular-nums tracking-[-0.04em] text-white">
                    {s.value}
                  </span>
                  {s.unit ? (
                    <span className="text-[15px] font-medium text-white/50">{s.unit}</span>
                  ) : null}
                </div>
                <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-white/55">{s.label}</p>
                {s.hint ? <p className="mt-2 text-[12px] leading-snug text-white/30">{s.hint}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Speed — hero metric strip */}
      <section
        className="relative z-10 border-t border-white/[0.06] py-20 sm:py-28 md:py-36"
        style={{ fontFamily: 'var(--ios-font)', ...generationsGreen }}
      >
        <div className={wideShell}>
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-emerald-200/40">Maximum speed</p>
            <p className="mt-6 text-[clamp(3.5rem,14vw,7.5rem)] font-extralight leading-none tracking-[-0.05em] text-white">
              {SPEED_KMH}
              <span className="ml-2 text-[clamp(1.25rem,4vw,2rem)] font-light text-white/45">km/h</span>
            </p>
            <p className="mt-4 text-[clamp(2.5rem,10vw,5rem)] font-extralight tracking-[-0.04em] text-white/35">
              {SPEED_MPH}
              <span className="ml-2 text-[clamp(1rem,3vw,1.5rem)] font-light text-white/35">mph</span>
            </p>
            <p className="mx-auto mt-8 max-w-lg text-[13px] leading-relaxed text-white/35">
              Illustrative top speed for a contemporary Formula 1 car — actual V<sub>max</sub> depends on circuit layout,
              trim, DRS, fuel level, and conditions. Not a team-reported AMR26 test figure.
            </p>
          </div>
        </div>
      </section>

      {/* Technical information — spec sheet */}
      <section
        className="relative z-10 border-t border-white/[0.06] py-16 sm:py-24"
        style={{ fontFamily: 'var(--ios-font)', ...sectionInk }}
      >
        <div className={wideShell}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-emerald-200/40">Information</p>
          <h3 className="mt-2 text-[clamp(1.5rem,4vw,2rem)] font-light tracking-[-0.02em] text-white">AMR26 overview</h3>

          <dl className="mt-12 divide-y divide-white/[0.08] border-t border-white/[0.08]">
            {AMR26_SPEC_ROWS.map((row) => (
              <div
                key={row.label}
                className="grid gap-2 py-5 sm:grid-cols-[minmax(0,200px)_1fr] sm:items-baseline sm:gap-10 sm:py-6"
              >
                <dt className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/40">{row.label}</dt>
                <dd className="text-[15px] font-normal leading-relaxed text-white/75 sm:text-[16px]">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Image + short copy */}
      <section
        className="relative z-10 border-t border-white/[0.05] py-16 sm:py-24 md:py-28"
        style={{ fontFamily: 'var(--ios-font)', ...generationsGreen }}
      >
        <div className={`${wideShell} grid items-center gap-12 lg:grid-cols-2 lg:gap-16`}>
          <div className="order-2 lg:order-1">
            <h3 className="text-[clamp(1.5rem,4vw,2rem)] font-light tracking-[-0.02em] text-white">Package over parts.</h3>
            <p className="mt-5 text-[15px] font-normal leading-relaxed text-white/45 sm:text-[16px]">
              2026 pairs a new chassis rule set with a new power unit philosophy — more electrical deployment, a different
              gearbox architecture, and a lighter car. The AMR26 is the first Aston Martin F1 machine conceived entirely
              in that framework.
            </p>
          </div>
          <div className="order-1 overflow-hidden rounded-[1.25rem] bg-black/30 ring-1 ring-white/[0.06] lg:order-2">
            <img
              src={AMR26_HERO}
              alt=""
              className="aspect-[4/5] w-full object-cover object-[85%_center] sm:aspect-[3/4]"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* Full-bleed image */}
      <section
        className="relative z-10 border-t border-white/[0.05] py-12 sm:py-20"
        style={{ fontFamily: 'var(--ios-font)', ...sectionInk }}
      >
        <div className="mx-auto max-w-[1400px] px-6 sm:px-8">
          <div className="overflow-hidden rounded-xl bg-black/25 ring-1 ring-white/[0.06] sm:rounded-2xl">
            <img
              src={AMR26_HERO}
              alt=""
              className="aspect-video w-full object-cover object-[center_35%]"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* Quote */}
      <section
        className="relative z-10 border-t border-white/[0.05] py-20 sm:py-28 md:py-32"
        style={{ fontFamily: 'var(--ios-font)', ...generationsGreen }}
      >
        <div className={`${wideShell} max-w-3xl text-center`}>
          <blockquote>
            <p className="text-[clamp(1.2rem,3.5vw,1.65rem)] font-light leading-[1.5] tracking-[-0.01em] text-white/85">
              “2026 is a rare moment in Formula 1 because, for the first time, the chassis and power unit regulations have
              changed together.”
            </p>
            <footer className="mt-8 text-[12px] font-semibold uppercase tracking-[0.18em] text-white/35">
              Adrian Newey · Aston Martin Aramco
            </footer>
          </blockquote>
        </div>
      </section>

      {/* CTA */}
      <section
        className="relative z-10 border-t border-white/[0.06] py-16 sm:py-24"
        style={{ fontFamily: 'var(--ios-font)', ...sectionInk }}
      >
        <div className={`${wideShell} text-center`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-200/40">Lineage</p>
          <h3 className="mt-3 text-[clamp(1.35rem,3.5vw,1.75rem)] font-light text-white">Every chassis. Every season.</h3>
          <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-white/38">
            Explore the full Aston Martin timeline in the app’s car-history view.
          </p>
          <Link
            to="/cars/team/aston-martin"
            className="mt-10 inline-flex items-center justify-center rounded-sm border border-white/20 bg-white/[0.06] px-10 py-3.5 text-[13px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-white/[0.1]"
          >
            Chassis history
          </Link>
        </div>
      </section>

      <div className="relative z-10 h-[max(24px,env(safe-area-inset-bottom))]" aria-hidden />
    </div>
  );
}
