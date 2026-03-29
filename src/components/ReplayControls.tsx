import type { DriverReplayData, ReplaySpeed } from '../hooks/useLapReplay';

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

function formatReplaySpeedLabel(s: ReplaySpeed): string {
  if (s === 0.25) return '0.25×';
  if (s === 0.5) return '0.5×';
  return `${s}×`;
}

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
  const pct = maxDuration > 0 ? (currentTime / maxDuration) * 100 : 0;

  return (
    <div
      className="ios-sheet-blur shrink-0 px-4 pt-3 pb-4 text-[15px] leading-snug sm:px-5 sm:pt-4"
      style={{
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
      }}
    >
      {/* Loading / error state */}
      {isLoading && (
        <div className="mb-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-[13px] font-medium" style={{ color: 'var(--ios-label-secondary)' }}>
              {loadingLabel}
            </span>
            <span className="text-[13px] tabular-nums" style={{ color: 'var(--ios-label-tertiary)' }}>
              {Math.round(progress * 100)}%
            </span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: 'var(--ios-grouped-tertiary)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ background: 'var(--ios-blue)', width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}

      {error && !isLoading && (
        <p className="text-[13px] font-medium mb-3" style={{ color: 'var(--ios-red)' }}>
          {error}
        </p>
      )}

      {/* Timeline scrubber */}
      <div className="flex items-center gap-5 mb-4">
        <span
          className="text-[13px] font-mono w-[5.5rem] shrink-0 tabular-nums pr-0.5"
          style={{ color: 'var(--ios-label-secondary)' }}
        >
          {formatTime(currentTime)}
        </span>
        <div className="relative flex-1 h-3.5 group">
          <div
            className="absolute inset-0 rounded-full cursor-pointer"
            style={{ background: 'var(--ios-grouped-tertiary)' }}
          />
          <div
            className="absolute top-0 left-0 h-full rounded-full pointer-events-none"
            style={{ width: `${pct}%`, background: 'var(--ios-blue)' }}
          />
          <input
            type="range"
            min={0}
            max={maxDuration || 100}
            step={0.01}
            value={currentTime}
            disabled={!hasData}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          {/* Thumb indicator */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full shadow pointer-events-none transition-opacity"
            style={{
              left: `calc(${pct}% - 9px)`,
              opacity: hasData ? 1 : 0.2,
              background: '#fff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
            }}
          />
        </div>
        <span
          className="text-[13px] font-mono w-[5.5rem] shrink-0 text-right tabular-nums pl-0.5"
          style={{ color: 'var(--ios-label-tertiary)' }}
        >
          {formatTime(maxDuration)}
        </span>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between gap-5">
        {/* Transport */}
        <div className="flex items-center gap-4">
          {/* Reset */}
          <button
            type="button"
            onClick={onReset}
            disabled={!hasData || isLoading}
            title="Reset"
            className="w-11 h-11 flex items-center justify-center rounded-full transition-opacity active:opacity-60 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ color: 'var(--ios-blue)', background: 'var(--ios-fill)' }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
            </svg>
          </button>

          {/* Play / Pause */}
          <button
            type="button"
            onClick={isPlaying ? onPause : onPlay}
            disabled={!hasData || isLoading}
            className="w-[52px] h-[52px] flex items-center justify-center rounded-full text-white transition-opacity active:opacity-85 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
            style={{ background: 'var(--ios-blue)' }}
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>

        {/* Speed + driver count */}
        <div className="flex items-center gap-5">
          {hasData && (
            <span className="text-[13px] whitespace-nowrap pr-0.5" style={{ color: 'var(--ios-label-tertiary)' }}>
              {driverData.length} drivers
            </span>
          )}

          {/* Speed selector */}
          <div
            className="flex items-center gap-1 rounded-[10px] p-1"
            style={{ background: 'var(--ios-fill)' }}
          >
            {SPEEDS.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => onSpeedChange(s)}
                disabled={!hasData || isLoading}
                className={`min-w-[2.35rem] px-2 py-1.5 rounded-[8px] text-[12px] sm:text-[13px] font-mono font-semibold transition-[background,color] disabled:opacity-30 ${
                  speed === s ? 'text-white' : ''
                }`}
                style={
                  speed === s
                    ? { background: 'rgba(120,120,128,0.45)', color: '#fff' }
                    : { color: 'rgba(235,235,245,0.5)' }
                }
              >
                {formatReplaySpeedLabel(s)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Driver best laps mini table */}
      {hasData && (
        <div className="mt-5 flex flex-wrap gap-2.5">
          {driverData
            .sort((a, b) => (a.bestLap.lap_duration ?? 0) - (b.bestLap.lap_duration ?? 0))
            .map(({ driver, bestLap }, i) => (
              <div
                key={driver.driver_number}
                className="flex items-center gap-2.5 rounded-[10px] px-3 py-2"
                style={{ background: 'var(--ios-grouped-secondary)' }}
              >
                <span
                  className="text-[11px] w-5 text-center tabular-nums"
                  style={{ color: 'var(--ios-label-tertiary)' }}
                >
                  {i + 1}
                </span>
                <div
                  className="w-2 h-2 rounded-full shrink-0 mx-0.5"
                  style={{ backgroundColor: `#${driver.team_colour}` }}
                />
                <span className="text-[13px] font-mono" style={{ color: 'var(--ios-label)' }}>
                  {driver.name_acronym}
                </span>
                <span
                  className="text-[13px] font-mono tabular-nums pl-2"
                  style={{ color: 'var(--ios-label-secondary)' }}
                >
                  {bestLap.lap_duration != null
                    ? formatTime(bestLap.lap_duration)
                    : '—'}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
