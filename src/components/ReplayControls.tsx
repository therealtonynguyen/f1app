import { SkipBack, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import type { DriverReplayData, ReplaySpeed } from '@/hooks/useLapReplay';

interface Props {
  driverData: DriverReplayData[];
  currentTime: number;
  maxDuration: number;
  isPlaying: boolean;
  speed: ReplaySpeed;
  isLoading: boolean;
  progress: number;
  loadingLabel: string;
  error: string | null;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onSeek: (t: number) => void;
  onSpeedChange: (s: ReplaySpeed) => void;
}

function formatTime(secs: number): string {
  if (!isFinite(secs) || secs < 0) return '0:00.000';
  const m = Math.floor(secs / 60);
  const s = (secs % 60).toFixed(3).padStart(6, '0');
  return `${m}:${s}`;
}

const SPEEDS: ReplaySpeed[] = [0.25, 0.5, 1, 2, 4, 8];

export function ReplayControls({
  driverData,
  currentTime,
  maxDuration,
  isPlaying,
  speed,
  isLoading,
  progress,
  loadingLabel,
  error,
  onPlay,
  onPause,
  onReset,
  onSeek,
  onSpeedChange,
}: Props) {
  const hasData = driverData.length > 0;

  return (
    <div
      className="ios-sheet-blur shrink-0 px-4 pt-3 pb-4 space-y-3"
      style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
    >
      {/* Loading bar */}
      {isLoading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{loadingLabel}</span>
            <span className="text-xs tabular-nums text-muted-foreground/60">
              {Math.round(progress * 100)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}

      {error && !isLoading && (
        <p className="text-xs text-destructive font-medium">{error}</p>
      )}

      {/* Timeline */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-muted-foreground w-20 tabular-nums">
          {formatTime(currentTime)}
        </span>
        <Slider
          value={[currentTime]}
          min={0}
          max={maxDuration || 100}
          step={0.01}
          disabled={!hasData}
          onValueChange={([v]) => onSeek(v!)}
          className="flex-1"
        />
        <span className="text-xs font-mono text-muted-foreground/50 w-20 text-right tabular-nums">
          {formatTime(maxDuration)}
        </span>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between gap-4">
        {/* Transport */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={onReset}
            disabled={!hasData || isLoading}
            aria-label="Reset"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            onClick={isPlaying ? onPause : onPlay}
            disabled={!hasData || isLoading}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="h-11 w-11"
          >
            {isPlaying
              ? <Pause className="h-5 w-5" />
              : <Play  className="h-5 w-5 ml-0.5" />
            }
          </Button>
        </div>

        {/* Right: driver count + speed */}
        <div className="flex items-center gap-3">
          {hasData && (
            <span className="text-xs text-muted-foreground/50">
              {driverData.length} drivers
            </span>
          )}
          <div className="flex items-center gap-0.5 rounded-lg bg-muted/40 p-0.5">
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSpeedChange(s)}
                disabled={!hasData || isLoading}
                className={cn(
                  'px-2 py-1 rounded-md text-[11px] font-mono font-semibold transition-all disabled:opacity-30',
                  speed === s
                    ? 'bg-secondary text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {s < 1 ? `${s}×` : `${s}×`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Best laps mini-table */}
      {hasData && (
        <div className="flex flex-wrap gap-2 pt-1">
          {driverData
            .sort((a, b) => (a.bestLap.lap_duration ?? 0) - (b.bestLap.lap_duration ?? 0))
            .map(({ driver, bestLap }, i) => (
              <div
                key={driver.driver_number}
                className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-1.5"
              >
                <span className="text-[11px] w-4 text-center text-muted-foreground/50 tabular-nums">
                  {i + 1}
                </span>
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: `#${driver.team_colour}` }}
                />
                <span className="text-[12px] font-mono text-foreground">{driver.name_acronym}</span>
                <span className="text-[12px] font-mono tabular-nums text-muted-foreground pl-1">
                  {bestLap.lap_duration != null ? formatTime(bestLap.lap_duration) : '—'}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
