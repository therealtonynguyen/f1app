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

const SPEEDS: ReplaySpeed[] = [1, 2, 4, 8];

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
    <div className="shrink-0 bg-[#0d0d15] border-t border-[#1e1e2e] px-4 py-3">
      {/* Loading / error state */}
      {isLoading && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500">{loadingLabel}</span>
            <span className="text-xs text-gray-600">{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-1 bg-[#1a1a2e] rounded overflow-hidden">
            <div
              className="h-full bg-red-500 rounded transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}

      {error && !isLoading && (
        <p className="text-xs text-red-400 mb-2">{error}</p>
      )}

      {/* Timeline scrubber */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs font-mono text-gray-400 w-20 shrink-0">
          {formatTime(currentTime)}
        </span>
        <div className="relative flex-1 h-2 group">
          <div className="absolute inset-0 bg-[#1a1a2e] rounded cursor-pointer" />
          <div
            className="absolute top-0 left-0 h-full bg-red-500 rounded pointer-events-none"
            style={{ width: `${pct}%` }}
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
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow pointer-events-none transition-opacity"
            style={{ left: `calc(${pct}% - 6px)`, opacity: hasData ? 1 : 0.2 }}
          />
        </div>
        <span className="text-xs font-mono text-gray-600 w-20 shrink-0 text-right">
          {formatTime(maxDuration)}
        </span>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between">
        {/* Transport */}
        <div className="flex items-center gap-2">
          {/* Reset */}
          <button
            onClick={onReset}
            disabled={!hasData || isLoading}
            title="Reset"
            className="w-8 h-8 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-[#1e1e2e] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
            </svg>
          </button>

          {/* Play / Pause */}
          <button
            onClick={isPlaying ? onPause : onPlay}
            disabled={!hasData || isLoading}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-400 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow"
          >
            {isPlaying ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>

        {/* Speed + driver count */}
        <div className="flex items-center gap-3">
          {hasData && (
            <span className="text-xs text-gray-600">
              {driverData.length} drivers
            </span>
          )}

          {/* Speed selector */}
          <div className="flex items-center gap-1 bg-[#13131f] rounded-lg p-1">
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                disabled={!hasData || isLoading}
                className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors disabled:opacity-30 ${
                  speed === s
                    ? 'bg-red-500 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Driver best laps mini table */}
      {hasData && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {driverData
            .sort((a, b) => (a.bestLap.lap_duration ?? 0) - (b.bestLap.lap_duration ?? 0))
            .map(({ driver, bestLap }, i) => (
              <div
                key={driver.driver_number}
                className="flex items-center gap-1.5 bg-[#13131f] rounded px-2 py-1"
              >
                <span className="text-[10px] text-gray-600 w-3">{i + 1}</span>
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: `#${driver.team_colour}` }}
                />
                <span className="text-[11px] font-mono text-gray-300">{driver.name_acronym}</span>
                <span className="text-[11px] font-mono text-gray-500">
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
