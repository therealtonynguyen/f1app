import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { CarsNavHoverPreview } from '@/components/CarsNavHoverPreview';

const LOGO_SRC =
  'https://cdn.prod.website-files.com/65fb46186d1d506d69123dfd/66be26b90be42c6c5ce04957_Hp2NXFo9JQYJ2iO7-4j57klBtqa9SF2a0Nm68oYKhCY.svg';

const linkBase =
  'rounded px-1.5 py-0.5 text-[10.5px] font-normal tracking-wide transition-colors sm:text-[11px]';

export function AppTopNav({ visible = true }: { visible?: boolean }) {
  const location = useLocation();
  const isCadillacBrandPage = location.pathname === '/cars/cadillac';
  const isAudiBrandPage = location.pathname === '/cars/audi';
  const isRacingBullsBrandPage = location.pathname === '/cars/racing-bulls';
  const isHaasBrandPage = location.pathname === '/cars/haas';
  const isWilliamsBrandPage = location.pathname === '/cars/williams';
  const isMcLarenBrandPage = location.pathname === '/cars/mclaren';
  const isRedBullBrandPage = location.pathname === '/cars/red-bull';
  const isAlpineBrandPage = location.pathname === '/cars/alpine';
  /** White bar + dark links — home only. Alpine uses pink bar + light links. */
  const isLightNav = location.pathname === '/';
  const navLightChrome = isLightNav;
  const isAstonBrandPage = location.pathname === '/cars/aston-martin';
  const isFerrariBrandPage = location.pathname === '/cars/ferrari';
  const carsActive = location.pathname.startsWith('/cars');
  /** Bump on each hover enter so car drive animations remount and play again. */
  const [carsDriveCycle, setCarsDriveCycle] = useState(0);
  const [carsMenuOpen, setCarsMenuOpen] = useState(false);

  return (
    <header
      className={cn(
        'fixed left-0 right-0 top-0 z-[100] overflow-visible border-b transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform',
        navLightChrome
          ? 'border-neutral-200/90 bg-white'
          : isAlpineBrandPage
            ? 'border-pink-700/35 bg-pink-500/95 backdrop-blur-xl backdrop-saturate-150'
            : isAstonBrandPage
            ? 'border-emerald-700/35 bg-[#0f2a1d]'
            : isFerrariBrandPage
              ? 'border-red-950/45 bg-[#1a0608]/58 backdrop-blur-2xl backdrop-saturate-150'
              : isRacingBullsBrandPage
                ? 'border-blue-800/40 bg-blue-950/95 backdrop-blur-xl backdrop-saturate-150'
                : isCadillacBrandPage ||
                    isAudiBrandPage ||
                    isHaasBrandPage ||
                    isWilliamsBrandPage ||
                    isMcLarenBrandPage ||
                    isRedBullBrandPage
                  ? 'border-black bg-black'
                  : 'border-white/[0.07] bg-black/70 backdrop-blur-2xl',
        visible ? 'translate-y-0' : 'pointer-events-none -translate-y-full'
      )}
      style={{
        paddingTop: 'max(0px, env(safe-area-inset-top))',
        fontFamily: 'var(--ios-font)',
      }}
    >
      <div className="mx-auto flex h-9 max-w-[980px] items-center justify-between gap-2 px-3 sm:h-9 sm:px-5">
        {/* pl-* nudges the logo right (margin on NavLink was easy to miss vs flex + justify-between) */}
        <div className="shrink-0 pl-14 sm:pl-20 md:pl-28 lg:pl-36">
          <NavLink
            to="/"
            end
            className={cn(
              'flex items-center transition-opacity',
              navLightChrome ? 'hover:opacity-80' : 'hover:opacity-90'
            )}
            aria-label="F1 Track home"
          >
            <img
              src={LOGO_SRC}
              alt=""
              className="h-[1.35rem] w-auto max-w-[min(52vw,200px)] object-contain object-left sm:h-[1.45rem]"
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          </NavLink>
        </div>

        <nav
          className="flex min-w-0 flex-1 items-center justify-end gap-0.5 overflow-x-visible overflow-y-visible sm:justify-center sm:gap-6 md:gap-8"
          aria-label="Main"
        >
          <NavLink
            to="/data"
            className={({ isActive }) =>
              cn(
                linkBase,
                'shrink-0',
                navLightChrome
                  ? isActive
                    ? 'text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-900'
                  : isActive
                    ? 'text-white'
                    : 'text-white/55 hover:text-white/85'
              )
            }
          >
            Data
          </NavLink>
          <NavLink
            to="/calendar"
            className={({ isActive }) =>
              cn(
                linkBase,
                'shrink-0',
                navLightChrome
                  ? isActive
                    ? 'text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-900'
                  : isActive
                    ? 'text-white'
                    : 'text-white/55 hover:text-white/85'
              )
            }
          >
            Calendar
          </NavLink>

          {/* Cars: hover reveals car strip (md+). carsDriveCycle restarts drive animation each hover. */}
          <div
            className="relative z-[120] shrink-0"
            onMouseEnter={() => {
              setCarsDriveCycle((n) => n + 1);
              setCarsMenuOpen(true);
            }}
            onMouseLeave={() => setCarsMenuOpen(false)}
            onFocusCapture={() => setCarsMenuOpen(true)}
            onBlurCapture={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setCarsMenuOpen(false);
            }}
          >
            <NavLink
              to="/cars"
              className={cn(
                linkBase,
                'relative z-[230] block',
                navLightChrome
                  ? carsActive
                    ? 'text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-900'
                  : carsActive
                    ? 'text-white'
                    : 'text-white/55 hover:text-white/85'
              )}
              onClick={() => setCarsMenuOpen(false)}
            >
              Cars
            </NavLink>
            {/* Invisible bridge so pointer can move from the nav link to the panel without leaving hover */}
            <div
              className={cn(
                'pointer-events-none fixed inset-x-0 z-[215] hidden h-4 sm:block',
                carsMenuOpen && 'sm:pointer-events-auto'
              )}
              style={{
                top: 'calc(max(env(safe-area-inset-top), 0px) + 2.25rem - 14px)',
              }}
              aria-hidden
            />
            {/* Sheet — white on light nav (home), black when nav is dark */}
            <div
              className={cn(
                'pointer-events-none fixed inset-x-0 z-[220] hidden origin-top',
                'h-[min(14vw,200px)] w-full max-h-[min(220px,26vh)] min-h-[110px] sm:h-[min(18vw,240px)] sm:min-h-[128px]',
                'overflow-hidden rounded-none border-b',
                navLightChrome
                  ? 'border-white/30 bg-white/[0.1] shadow-[0_12px_44px_-18px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.4)] backdrop-blur-3xl backdrop-saturate-[1.35]'
                  : 'border-white/[0.14] bg-black/[0.18] shadow-[0_18px_50px_-14px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-3xl backdrop-saturate-150',
                '-translate-y-full opacity-0',
                'motion-reduce:translate-y-0',
                'will-change-transform',
                'transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
                'motion-reduce:transition-[opacity] motion-reduce:duration-150',
                'sm:block',
                carsMenuOpen && 'pointer-events-auto translate-y-0 opacity-100'
              )}
              style={{
                top: 'calc(max(env(safe-area-inset-top), 0px) + 2.25rem - 1px)',
              }}
              role="presentation"
              aria-hidden
            >
              <CarsNavHoverPreview
                key={carsDriveCycle}
                variant={navLightChrome ? 'light' : 'dark'}
                onNavigate={() => setCarsMenuOpen(false)}
              />
            </div>
          </div>

          <span
            className={cn(
              'shrink-0 px-1.5 py-0.5 text-[10.5px] font-normal tracking-wide sm:text-[11px]',
              navLightChrome ? 'text-neutral-400' : 'text-white/22'
            )}
            aria-disabled
          >
            News
          </span>
        </nav>
      </div>
    </header>
  );
}
