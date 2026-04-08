import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type TeamTile = {
  name: string;
  path: string;
  logoUrl: string;
  maxWidthClass: string;
  /** When set, overrides the default strip max height for this logo */
  maxHeight?: string;
};

const TEAM_TILES: TeamTile[] = [
  {
    name: 'Aston Martin',
    path: '/cars/aston-martin',
    logoUrl: 'https://car-brand-names.com/wp-content/uploads/2019/10/Aston-Martin-Logo-2003.png',
    maxWidthClass: 'max-w-[min(22vw,120px)]',
  },
  {
    name: 'Ferrari',
    path: '/cars/ferrari',
    logoUrl: 'https://static.wixstatic.com/media/f2bf43_655a783d22fd4786aa17b096ba3ff9e5~mv2.png',
    maxWidthClass: 'max-w-[min(22vw,120px)]',
  },
  {
    name: 'Red Bull Racing',
    path: '/cars/team/red-bull-racing',
    logoUrl: 'https://www.freepnglogos.com/uploads/red-bull-logo/red-bull-energy-png-logo-10.png',
    maxWidthClass: 'max-w-[min(52vw,340px)]',
    maxHeight: 'min(24vh, 108px)',
  },
  {
    name: 'Williams',
    path: '/cars/team/williams',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Logo_Williams_F1.png',
    maxWidthClass: 'max-w-[min(17vw,90px)]',
  },
  {
    name: 'Racing Bulls',
    path: '/cars/racing-bulls',
    logoUrl: 'https://liquipedia.net/commons/images/thumb/3/39/RB_allmode.png/600px-RB_allmode.png',
    maxWidthClass: 'max-w-[min(18vw,96px)]',
  },
  {
    name: 'Cadillac',
    path: '/cars/cadillac',
    logoUrl: 'https://1000logos.net/wp-content/uploads/2020/04/Cadillac-Logo.png',
    maxWidthClass: 'max-w-[min(18vw,96px)]',
  },
  {
    name: 'Haas',
    path: '/cars/team/haas',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Logo_Haas_F1.png/330px-Logo_Haas_F1.png',
    maxWidthClass: 'max-w-[min(16vw,84px)]',
  },
  {
    name: 'Alpine',
    path: '/cars/alpine',
    logoUrl: 'https://download.logo.wine/logo/Alpine_(automobile)/Alpine_(automobile)-Logo.wine.png',
    maxWidthClass: 'max-w-[min(18vw,96px)]',
  },
  {
    name: 'McLaren',
    path: '/cars/team/mclaren',
    logoUrl: 'https://img.icons8.com/ios_filled/512/FD7E14/mclaren.png',
    maxWidthClass: 'max-w-[min(16vw,88px)]',
  },
  {
    name: 'Mercedes',
    path: '/cars/mercedes',
    logoUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Mercedes-Logo.svg/3840px-Mercedes-Logo.svg.png',
    maxWidthClass: 'max-w-[min(16vw,84px)]',
  },
  {
    name: 'Audi',
    path: '/cars/audi',
    logoUrl:
      'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/ab371d58-f694-4953-a2e5-c79acedd9f56/d8nugw9-8e355eca-4fdd-4e2e-8ffa-348e70a4be6f.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiIvZi9hYjM3MWQ1OC1mNjk0LTQ5NTMtYTJlNS1jNzlhY2VkZDlmNTYvZDhudWd3OS04ZTM1NWVjYS00ZmRkLTRlMmUtOGZmYS0zNDhlNzBhNGJlNmYucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.T6Zybu8XfrcMYeSqc02DasrEQi_JzJ9okkB2a9SqHj8',
    maxWidthClass: 'max-w-[min(16vw,84px)]',
  },
];

const logoMaxH = 'min(12vh, 64px)';

function TeamStripLink({
  team,
  idx,
  ringTone,
  onNavigate,
}: {
  team: TeamTile;
  idx: number;
  ringTone: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      to={team.path}
      className={cn(
        'relative flex shrink-0 cursor-pointer items-center justify-center rounded-sm outline-none ring-offset-2 ring-offset-transparent transition-opacity hover:opacity-90 focus-visible:ring-2',
        idx === 0 && 'z-[1]',
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
        className={cn('pointer-events-none h-auto w-auto object-contain object-center', team.maxWidthClass)}
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
 * Aston, Ferrari, Red Bull, Williams marks for quick team access.
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
            'cars-nav-drive-strip absolute inset-0 flex w-full min-w-0 flex-nowrap items-center justify-between overflow-x-auto overflow-y-hidden',
            'gap-[clamp(0.5rem,2.5vw,2.25rem)] px-[clamp(0.75rem,4vw,3rem)]'
          )}
        >
          <>
            <TeamStripLink team={TEAM_TILES[0]!} idx={0} ringTone={ringTone} onNavigate={onNavigate} />
            {/* Tight cluster so Ferrari + Williams sit close to the large Red Bull mark */}
            <div className="flex shrink-0 items-center gap-[clamp(0.0625rem,0.45vw,0.45rem)] sm:gap-[clamp(0.125rem,0.55vw,0.5rem)]">
              <TeamStripLink team={TEAM_TILES[1]!} idx={1} ringTone={ringTone} onNavigate={onNavigate} />
              <TeamStripLink team={TEAM_TILES[2]!} idx={2} ringTone={ringTone} onNavigate={onNavigate} />
              <TeamStripLink team={TEAM_TILES[3]!} idx={3} ringTone={ringTone} onNavigate={onNavigate} />
            </div>
            {TEAM_TILES.slice(4).map((team, j) => {
              const idx = 4 + j;
              if (team.name === 'Audi') {
                return (
                  <div
                    key="audi-years"
                    className="flex shrink-0 items-center gap-[clamp(0.25rem,1vw,0.75rem)]"
                  >
                    <Link
                      to={team.path}
                      className={cn(
                        'relative flex shrink-0 cursor-pointer items-center justify-center rounded-sm outline-none ring-offset-2 ring-offset-transparent transition-opacity hover:opacity-90 focus-visible:ring-2',
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
                          'pointer-events-none h-auto w-auto object-contain object-center',
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
                        'relative flex h-[min(12vh,64px)] w-[clamp(1.75rem,4vw,3rem)] shrink-0 cursor-pointer flex-col items-center justify-center rounded-sm outline-none ring-offset-2 ring-offset-transparent transition-opacity hover:opacity-90 focus-visible:ring-2',
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
                        className="inline-block origin-center -rotate-90 whitespace-nowrap text-[clamp(9px,1.35vw,14px)] font-semibold uppercase tracking-[0.22em] sm:tracking-[0.26em]"
                        style={{ fontFamily: 'var(--ios-font)' }}
                      >
                        YEARS
                      </span>
                    </Link>
                  </div>
                );
              }
              return (
                <TeamStripLink
                  key={team.name}
                  team={team}
                  idx={idx}
                  ringTone={ringTone}
                  onNavigate={onNavigate}
                />
              );
            })}
          </>
        </div>
      </div>
    </div>
  );
}
