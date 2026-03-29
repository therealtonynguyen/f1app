import type { Session } from '../types/openf1';
import type { AppMode } from '../types/appMode';

type HeaderProps = {
  session: Session | null;
  isLive: boolean;
  isLoading: boolean;
  isLoadingTrack: boolean;
  onRefresh: () => void;
  mode: AppMode;
  onModeChange?: (mode: AppMode) => void;
};

const MODES: { id: AppMode; label: string }[] = [
  { id: 'live', label: 'Live' },
  { id: 'replay', label: 'Replay' },
  { id: 'graphs', label: 'Graphs' },
  { id: 'map', label: 'Map' },
];

function sessionTitle(session: Session | null): string {
  if (!session) return 'F1';
  const name = session.session_name?.trim();
  if (name) return name;
  return [session.location, session.session_type].filter(Boolean).join(' · ') || 'Session';
}

export function Header({
  session,
  isLive,
  isLoading,
  isLoadingTrack,
  onRefresh,
  mode,
  onModeChange,
}: HeaderProps) {
  const title = sessionTitle(session);

  return (
    <header
      className="ios-nav-blur shrink-0 z-20"
      style={{
        paddingTop: 'max(8px, env(safe-area-inset-top))',
        paddingBottom: 10,
        paddingLeft: 'max(16px, env(safe-area-inset-left))',
        paddingRight: 'max(16px, env(safe-area-inset-right))',
      }}
    >
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-3 min-h-[36px] sm:gap-4">
          <div
            className="app-logo-mark shrink-0"
            role="img"
            aria-label="F1 Track"
          >
            <span className="app-logo-f1">F1</span>
            <span className="app-logo-rest">Track</span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-[17px] font-semibold tracking-tight text-white truncate leading-tight">
              {title}
            </h1>
            {session && (
              <div className="flex items-center gap-3 mt-0.5">
                {isLive && (
                  <span className="inline-flex items-center gap-2 text-[12px] font-medium text-[rgba(235,235,245,0.55)]">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{
                        background: 'var(--ios-green)',
                        boxShadow: '0 0 0 2px rgba(48,209,88,0.25)',
                      }}
                    />
                    Live
                  </span>
                )}
                {isLoadingTrack && (
                  <span className="text-[12px] font-medium text-[rgba(235,235,245,0.45)]">
                    Track…
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="shrink-0 h-9 min-w-[36px] px-3 rounded-full text-[15px] font-semibold transition-opacity active:opacity-65 disabled:opacity-35"
            style={{
              background: 'var(--ios-fill)',
              color: 'var(--ios-blue)',
            }}
            aria-label="Refresh"
          >
            {isLoading ? '…' : '↻'}
          </button>
        </div>

        {onModeChange && (
          <div
            className="flex p-1 rounded-[10px] w-full gap-0.5"
            style={{ background: 'var(--ios-fill)' }}
            role="tablist"
            aria-label="View mode"
          >
            {MODES.map(({ id, label }) => {
              const active = mode === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onModeChange(id)}
                  className="flex-1 min-w-0 py-2 px-2 rounded-[8px] text-[11px] font-semibold transition-[background,color,box-shadow] duration-200 ease-out sm:text-[12px]"
                  style={
                    active
                      ? {
                          background: 'rgba(120, 120, 128, 0.36)',
                          color: '#fff',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.35)',
                        }
                      : {
                          background: 'transparent',
                          color: 'rgba(235,235,245,0.55)',
                        }
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
