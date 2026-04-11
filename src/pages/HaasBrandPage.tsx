import { Link } from 'react-router-dom';

export function HaasBrandPage() {
  return (
    <div className="relative -mt-[var(--app-top-nav-offset)] flex min-h-0 flex-1 flex-col bg-white">
      <section
        className="flex min-h-[90dvh] w-full flex-1 items-center justify-center bg-white px-5 py-16 sm:px-10"
        aria-label="Haas F1"
      >
        <div className="flex w-[min(88%,36rem)] min-h-[min(42vh,320px)] max-w-xl items-center justify-center border-2 border-red-600 bg-white sm:min-h-[min(40vh,380px)] sm:w-[min(82%,34rem)]" />
      </section>

      <section
        className="relative z-10 border-t border-neutral-200 bg-white px-5 py-16 sm:px-10"
        style={{ fontFamily: 'var(--ios-font)' }}
      >
        <div className="mx-auto max-w-xl text-center">
          <Link
            to="/cars/team/haas"
            className="inline-flex rounded-full border border-neutral-300 bg-neutral-50 px-8 py-3 text-[14px] font-semibold text-neutral-900 transition-colors hover:bg-neutral-100"
          >
            Chassis history
          </Link>
        </div>
      </section>

      <div className="h-[max(24px,env(safe-area-inset-bottom))] bg-white" aria-hidden />
    </div>
  );
}
