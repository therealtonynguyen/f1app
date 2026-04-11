import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type TeamTile = {
  name: string;
  path: string;
  /** Side-profile car render (FOM) — shown in the strip instead of team logo */
  logoUrl: string;
  maxWidthClass: string;
  /** When set, overrides the default strip max height */
  maxHeight?: string;
};

/** Wide side-view renders — larger; strip scrolls horizontally */
const carStripW = 'max-w-full';
const carStripH = 'min(18vh, 96px)';

const TEAM_TILES: TeamTile[] = [
  {
    name: 'Aston Martin',
    path: '/cars/aston-martin',
    logoUrl:
      'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/common/f1/2026/astonmartin/2026astonmartincarright.webp',
    maxWidthClass: carStripW,
    maxHeight: carStripH,
  },
  {
    name: 'Ferrari',
    path: '/cars/ferrari',
    logoUrl:
      'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/common/f1/2026/ferrari/2026ferraricarright.webp',
    maxWidthClass: carStripW,
    maxHeight: carStripH,
  },
  {
    name: 'Red Bull Racing',
    path: '/cars/red-bull',
    logoUrl:
      'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/common/f1/2026/redbullracing/2026redbullracingcarright.webp',
    maxWidthClass: carStripW,
    maxHeight: carStripH,
  },
  {
    name: 'Williams',
    path: '/cars/williams',
    logoUrl:
      'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/common/f1/2026/williams/2026williamscarright.webp',
    maxWidthClass: carStripW,
    maxHeight: carStripH,
  },
  {
    name: 'Racing Bulls',
    path: '/cars/racing-bulls',
    logoUrl:
      'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/common/f1/2026/racingbulls/2026racingbullscarright.webp',
    maxWidthClass: carStripW,
    maxHeight: carStripH,
  },
  {
    name: 'Cadillac',
    path: '/cars/cadillac',
    logoUrl:
      'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/common/f1/2026/cadillac/2026cadillaccarright.webp',
    maxWidthClass: carStripW,
    maxHeight: carStripH,
  },
  {
    name: 'Haas',
    path: '/cars/haas',
    logoUrl:
      'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/common/f1/2026/haas/2026haascarright.webp',
    maxWidthClass: carStripW,
    maxHeight: carStripH,
  },
  {
    name: 'Alpine',
    path: '/cars/alpine',
    logoUrl:
      'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/common/f1/2026/alpine/2026alpinecarright.webp',
    maxWidthClass: carStripW,
    maxHeight: carStripH,
  },
  {
    name: 'McLaren',
    path: '/cars/mclaren',
    logoUrl:
      'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/common/f1/2026/mclaren/2026mclarencarright.webp',
    maxWidthClass: carStripW,
    maxHeight: carStripH,
  },
  {
    name: 'Mercedes',
    path: '/cars/mercedes',
    logoUrl:
      'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/common/f1/2026/mercedes/2026mercedescarright.webp',
    maxWidthClass: carStripW,
    maxHeight: carStripH,
  },
  {
    name: 'Audi',
    path: '/cars/audi',
    logoUrl:
      'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/common/f1/2026/audi/2026audicarright.webp',
    maxWidthClass: carStripW,
    maxHeight: carStripH,
  },
];

const logoMaxH = carStripH;

/** Wider than the viewport — continues off the right edge; scroll horizontally */
const stripInnerGridClass =
  'inline-grid w-max min-w-max grid-cols-11 [grid-template-columns:repeat(11,minmax(6.5rem,auto))] items-center gap-x-[clamp(1rem,3vw,2rem)] px-[clamp(1.25rem,6vw,4rem)] py-0.5';

function TeamStripLink({
  team,
  ringTone,
  onNavigate,
}: {
  team: TeamTile;
  ringTone: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      to={team.path}
      className={cn(
        'relative flex w-full min-w-0 max-w-full cursor-pointer snap-start items-center justify-center rounded-sm outline-none ring-offset-2 ring-offset-transparent transition-opacity hover:opacity-90 focus-visible:ring-2',
        ringTone
      )}
      aria-label={`${team.name} — team page`}
      onClick={(e) => {
        e.stopPropagation();
        onNavigate?.();
      }}
    >
      <img
        src={team.logoUrl}
        alt=""
        className={cn(
          'pointer-events-none h-auto w-auto min-w-0 max-w-full object-contain object-center',
          team.maxWidthClass
        )}
        style={{ maxHeight: team.maxHeight ?? logoMaxH }}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
      />
    </Link>
  );
}

export type CarsNavHoverPreviewVariant = 'light' | 'dark';

/**
 * Team side-profile car renders (FOM) for quick access under Cars.
 * `dark` matches a black nav bar; `light` matches a white / non-black bar.
 */
export function CarsNavHoverPreview({
  variant = 'light',
  onNavigate,
}: {
  variant?: CarsNavHoverPreviewVariant;
  onNavigate?: () => void;
}) {
  const ringTone = variant === 'light' ? 'focus-visible:ring-neutral-900/25' : 'focus-visible:ring-white/40';
  const yearsLabel =
    variant === 'light'
      ? 'text-neutral-700 hover:text-neutral-900'
      : 'text-white/70 hover:text-white/95';

  return (
    <div
      className="flex h-full min-h-0 w-full flex-col items-stretch justify-center py-1 pr-3 sm:py-2 sm:pr-4"
    >
      <div className="relative h-full w-full min-h-0 flex-1 overflow-hidden">
        <div
          className={cn(
            'cars-nav-drive-strip absolute inset-0 min-h-0 overflow-x-auto overflow-y-hidden',
            '[scrollbar-gutter:stable]',
            'snap-x snap-mandatory scroll-pl-4 scroll-pr-8 sm:scroll-pl-6 sm:scroll-pr-12'
          )}
          title="Scroll sideways to browse teams"
        >
          <div className="flex min-h-full w-max shrink-0 flex-col justify-center">
            <div className={stripInnerGridClass}>
            {TEAM_TILES.map((team) => {
              if (team.name === 'Audi') {
                return (
                  <div
                    key="audi-years"
                    className="flex min-h-0 min-w-0 snap-start items-center justify-center gap-[clamp(0.25rem,0.85vw,0.55rem)] overflow-hidden"
                  >
                    <Link
                      to={team.path}
                      className={cn(
                        'relative flex min-h-0 min-w-0 max-w-full flex-1 cursor-pointer items-center justify-center rounded-sm outline-none ring-offset-2 ring-offset-transparent transition-opacity hover:opacity-90 focus-visible:ring-2',
                        ringTone
                      )}
                      aria-label={`${team.name} — brand page`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate?.();
                      }}
                    >
                      <img
                        src={team.logoUrl}
                        alt=""
                        className={cn(
                          'pointer-events-none h-auto w-auto min-w-0 max-w-full object-contain object-center',
                          team.maxWidthClass
                        )}
                        style={{ maxHeight: team.maxHeight ?? logoMaxH }}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                      />
                    </Link>
                    <Link
                      to="/cars"
                      className={cn(
                        'relative flex h-[min(18vh,96px)] w-[clamp(1.5rem,3.8vw,2.85rem)] shrink-0 cursor-pointer flex-col items-center justify-center rounded-sm outline-none ring-offset-2 ring-offset-transparent transition-opacity hover:opacity-90 focus-visible:ring-2',
                        ringTone,
                        yearsLabel
                      )}
                      aria-label="Cars — browse by year"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate?.();
                      }}
                    >
                      <span
                        className="inline-block origin-center -rotate-90 whitespace-nowrap text-[clamp(10px,1.5vw,15px)] font-semibold uppercase tracking-[0.22em] sm:tracking-[0.26em]"
                        style={{ fontFamily: 'var(--ios-font)' }}
                      >
                        YEARS
                      </span>
                    </Link>
                  </div>
                );
              }
              return (
                <div
                  key={team.name}
                  className="flex min-h-0 min-w-0 snap-start items-center justify-center overflow-hidden"
                >
                  <TeamStripLink team={team} ringTone={ringTone} onNavigate={onNavigate} />
                </div>
              );
            })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
