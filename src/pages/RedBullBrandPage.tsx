import { Link } from 'react-router-dom';

/** Red Bull — Max Verstappen, Abu Dhabi Grand Prix 2023 */
const RED_BULL_HERO_IMG =
  'https://img.redbull.com/images/w_3000/q_auto,f_auto/redbullcom/2023/11/26/kad8pgnushzugkhfmcmj/max-verstappen-abu-dhabi-grand-prix-2023';

export function RedBullBrandPage() {
  return (
    <div
      className="relative -mt-[var(--app-top-nav-offset)] flex min-h-0 flex-1 flex-col bg-neutral-950"
      style={{ fontFamily: 'var(--ios-font)' }}
    >
      <section className="relative min-h-[min(100dvh,960px)] w-full overflow-hidden">
        <img
          src={RED_BULL_HERO_IMG}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25"
          aria-hidden
        />
      </section>

      <section className="relative z-10 border-t border-white/10 bg-neutral-950 px-6 py-16 sm:px-10 sm:py-20">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-neutral-500">Red Bull Racing</p>
          <Link
            to="/cars/team/red-bull-racing"
            className="mt-10 inline-flex rounded-full border border-white/20 bg-white/5 px-8 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-white/10"
          >
            Chassis history
          </Link>
        </div>
      </section>

      <div className="h-[max(24px,env(safe-area-inset-bottom))] bg-neutral-950" aria-hidden />
    </div>
  );
}
