import { RefreshCw, Calendar, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Session } from '@/types/openf1';
import type { AppMode } from '@/types/appMode';
import type { Theme } from '@/hooks/useTheme';

type HeaderProps = {
  session: Session | null;
  isLive: boolean;
  isLoading: boolean;
  isLoadingTrack: boolean;
  onRefresh: () => void;
  onOpenSessionPicker?: () => void;
  mode: AppMode;
  onModeChange?: (mode: AppMode) => void;
  theme: Theme;
  onToggleTheme: () => void;
};

const MODES: { id: AppMode; label: string }[] = [
  { id: 'live',   label: 'Live'   },
  { id: 'replay', label: 'Replay' },
  { id: 'graphs', label: 'Graphs' },
  { id: 'map',    label: 'Map'    },
];

export function Header({
  session,
  isLive,
  isLoading,
  isLoadingTrack,
  onRefresh,
  onOpenSessionPicker,
  mode,
  onModeChange,
  theme,
  onToggleTheme,
}: HeaderProps) {
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
      <div className="flex flex-col gap-3">
        {/* Top row: logo | [spacer] | session + live | refresh + theme */}
        <div className="flex items-center gap-3 min-h-[36px]">
          {/* Logo */}
          <div className="app-logo-mark shrink-0" role="img" aria-label="F1 Track">
            <span className="app-logo-f1">F1</span>
            <span className="app-logo-rest">Track</span>
          </div>

          {/* Live badge + track loading (left-ish) */}
          <div className="flex items-center gap-1.5">
            {isLive && (
              <Badge variant="live" className="gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                Live
              </Badge>
            )}
            {isLoadingTrack && (
              <span className="text-[11px] animate-pulse" style={{ color: 'var(--ios-label-tertiary)' }}>
                Track…
              </span>
            )}
          </div>

          <div className="flex-1" />

          {/* Race selection — right side */}
          {session && (
            <button
              type="button"
              onClick={onOpenSessionPicker}
              disabled={!onOpenSessionPicker}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors disabled:cursor-default"
              style={{
                background: 'var(--ios-fill)',
                color: 'var(--ios-label)',
              }}
            >
              <Calendar className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--ios-blue)' }} />
              <span className="text-[13px] font-medium truncate max-w-[140px]">
                {session.location}
              </span>
              <span className="text-[11px] hidden sm:block" style={{ color: 'var(--ios-label-secondary)' }}>
                · {session.session_name}
              </span>
            </button>
          )}

          {/* Refresh + theme toggle */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isLoading}
              aria-label="Refresh"
              className="h-8 w-8"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="h-8 w-8"
            >
              {theme === 'dark'
                ? <Sun className="h-4 w-4" />
                : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mode tabs — prominent pill selector */}
        {onModeChange && (
          <div
            className="flex rounded-xl p-1 gap-0.5"
            style={{ background: 'var(--ios-grouped-secondary)' }}
            role="tablist"
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
                  className="flex-1 rounded-[9px] py-2 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={
                    active
                      ? {
                          background: '#e10600',
                          color: '#ffffff',
                          boxShadow: '0 1px 4px rgba(225,6,0,0.45), 0 1px 2px rgba(0,0,0,0.25)',
                        }
                      : {
                          background: 'transparent',
                          color: 'var(--ios-label-secondary)',
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
