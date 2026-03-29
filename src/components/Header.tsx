import { RefreshCw, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type { Session } from '@/types/openf1';
import type { AppMode } from '@/types/appMode';

type HeaderProps = {
  session: Session | null;
  isLive: boolean;
  isLoading: boolean;
  isLoadingTrack: boolean;
  onRefresh: () => void;
  onOpenSessionPicker?: () => void;
  mode: AppMode;
  onModeChange?: (mode: AppMode) => void;
};

const MODES: { id: AppMode; label: string }[] = [
  { id: 'live',    label: 'Live'    },
  { id: 'replay',  label: 'Replay'  },
  { id: 'graphs',  label: 'Graphs'  },
  { id: 'map',     label: 'Map'     },
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
      <div className="flex flex-col gap-2.5">
        {/* Top row */}
        <div className="flex items-center gap-3 min-h-[36px]">
          {/* Logo */}
          <div className="app-logo-mark shrink-0" role="img" aria-label="F1 Track">
            <span className="app-logo-f1">F1</span>
            <span className="app-logo-rest">Track</span>
          </div>

          {/* Session info */}
          <div className="min-w-0 flex-1">
            {session ? (
              <button
                type="button"
                onClick={onOpenSessionPicker}
                disabled={!onOpenSessionPicker}
                className="flex items-center gap-1 group text-left disabled:cursor-default"
              >
                <span className="text-[15px] font-semibold text-foreground truncate leading-tight">
                  {session.location}
                </span>
                <span className="text-[13px] text-muted-foreground truncate hidden sm:block">
                  · {session.session_name}
                </span>
                {onOpenSessionPicker && (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
                )}
              </button>
            ) : (
              <span className="text-[15px] text-muted-foreground">Connecting…</span>
            )}

            {/* Sub-row: live badge + loading state */}
            <div className="flex items-center gap-2 mt-0.5">
              {isLive && (
                <Badge variant="live" className="gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                  Live
                </Badge>
              )}
              {isLoadingTrack && (
                <span className="text-[11px] text-muted-foreground animate-pulse">Track…</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
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
          </div>
        </div>

        {/* Mode tabs */}
        {onModeChange && (
          <Tabs value={mode} onValueChange={(v) => onModeChange(v as AppMode)}>
            <TabsList className="w-full">
              {MODES.map(({ id, label }) => (
                <TabsTrigger key={id} value={id} className="flex-1">
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
      </div>
    </header>
  );
}
