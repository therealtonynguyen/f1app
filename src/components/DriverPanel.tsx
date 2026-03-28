import type { DriverWithData, Lap, CarData } from '../types/openf1';
import type { DriverReplayData } from '../hooks/useLapReplay';
import { TrackVisibilitySwitch } from './TrackVisibilitySwitch';

interface Props {
  drivers: DriverWithData[];
  selectedDriverNumber: number | null;
  onSelectDriver: (n: number | null) => void;
  selectedDriverLaps: Lap[];
  selectedDriverCarData: CarData | null;
  replayMode?: boolean;
  replayDriverData?: DriverReplayData[];
  replayCurrentTime?: number;
  driversHiddenOnTrack: Set<number>;
  onToggleDriverTrackVisibility: (driverNumber: number) => void;
}

function formatLap(seconds: number | null | undefined): string {
  if (seconds == null) return '—';
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(3).padStart(6, '0');
  return `${m}:${s}`;
}

function formatGap(gap: string | number | null | undefined): string {
  if (gap == null) return '—';
  if (typeof gap === 'number') return gap === 0 ? 'Leader' : `+${gap.toFixed(3)}`;
  return gap;
}

function teamColor(hex: string): string {
  return `#${hex || 'ffffff'}`;
}

function TelemetryBar({
  label,
  value,
  display,
  color,
  unit,
}: {
  label: string;
  value: number;
  display?: string;
  color: string;
  unit?: string;
}) {
  return (
    <div className="bg-[#13131f] rounded-lg p-3">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs font-mono font-semibold text-white">
          {display ?? value}
          {unit && <span className="text-gray-500 ml-0.5">{unit}</span>}
        </span>
      </div>
      <div className="h-1 bg-[#0a0a12] rounded overflow-hidden">
        <div
          className="h-full rounded transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// Fraction of lap completed at time t (0–1). Drivers with no data go last.
function lapProgress(lapDuration: number | null | undefined, t: number): number {
  if (!lapDuration || lapDuration <= 0) return -1;
  return Math.min(t, lapDuration) / lapDuration;
}

export function DriverPanel({
  drivers,
  selectedDriverNumber,
  onSelectDriver,
  selectedDriverLaps,
  selectedDriverCarData,
  replayMode = false,
  replayDriverData = [],
  replayCurrentTime = 0,
  driversHiddenOnTrack,
  onToggleDriverTrackVisibility,
}: Props) {
  const replayByDriver = new Map(replayDriverData.map((d) => [d.driver.driver_number, d]));

  // In replay mode, sort live by who has completed the most of their best lap
  const sortedDrivers = replayMode
    ? [...drivers].sort((a, b) => {
        const pa = lapProgress(
          replayByDriver.get(a.driver_number)?.bestLap.lap_duration,
          replayCurrentTime
        );
        const pb = lapProgress(
          replayByDriver.get(b.driver_number)?.bestLap.lap_duration,
          replayCurrentTime
        );
        return pb - pa; // descending — most progress first
      })
    : drivers;

  // Pre-compute leader progress for gap calculation
  const leaderProgress = replayMode && sortedDrivers.length > 0
    ? lapProgress(
        replayByDriver.get(sortedDrivers[0].driver_number)?.bestLap.lap_duration,
        replayCurrentTime
      )
    : 0;
  const selected = drivers.find((d) => d.driver_number === selectedDriverNumber);

  const validLaps = selectedDriverLaps.filter((l) => l.lap_duration != null && !l.is_pit_out_lap);
  const bestLap = [...validLaps].sort((a, b) => (a.lap_duration ?? 0) - (b.lap_duration ?? 0))[0];
  const lastLap = validLaps[validLaps.length - 1];

  return (
    <div className="flex flex-col h-full bg-[#0d0d15] border-l border-[#1e1e2e]">
      {/* Driver list */}
      <div className={`overflow-y-auto ${selected ? 'max-h-[45%]' : 'flex-1'}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-[#1e1e2e] bg-[#0d0d15] px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            Drivers
          </span>
          <span className="text-[9px] font-medium uppercase tracking-wider text-gray-600">
            Track
          </span>
        </div>

        {sortedDrivers.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-600">No driver data</div>
        ) : (
          sortedDrivers.map((d) => {
            const active = d.driver_number === selectedDriverNumber;
            const color = teamColor(d.team_colour);
            const visibleOnTrack = !driversHiddenOnTrack.has(d.driver_number);
            return (
              <div
                key={d.driver_number}
                onClick={() => onSelectDriver(active ? null : d.driver_number)}
                className={`flex cursor-pointer items-center gap-2 border-b border-[#141420] px-3 py-2 transition-colors ${
                  active ? 'bg-[#17172a]' : 'hover:bg-[#111120]'
                }`}
              >
                {/* Position / rank */}
                <div className="w-5 shrink-0 text-center text-xs font-bold text-gray-500">
                  {replayMode
                    ? sortedDrivers.indexOf(d) + 1
                    : (d.position ?? '—')}
                </div>

                {/* Team color */}
                <div
                  className="w-0.5 h-7 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono text-gray-600">{d.driver_number}</span>
                    <span
                      className={`text-sm font-semibold truncate ${active ? 'text-white' : 'text-gray-200'}`}
                    >
                      {d.name_acronym}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-600 truncate">{d.team_name}</div>
                </div>

                {/* Gap to leader (replay) or race gap (live) */}
                <div className="shrink-0 text-[11px] font-mono">
                  {replayMode ? (() => {
                    const rd = replayByDriver.get(d.driver_number);
                    if (!rd) return <span className="text-gray-600">—</span>;
                    const progress = lapProgress(rd.bestLap.lap_duration, replayCurrentTime);
                    const rank = sortedDrivers.indexOf(d);
                    if (rank === 0) return <span className="text-yellow-400 font-semibold">Leader</span>;
                    // Gap = how far behind the leader in fractional seconds
                    const gapFrac = leaderProgress - progress;
                    const gapSec = gapFrac * (rd.bestLap.lap_duration ?? 0);
                    return (
                      <span className="text-gray-400">
                        +{gapSec.toFixed(3)}s
                      </span>
                    );
                  })() : (
                    <span className="text-gray-500">{formatGap(d.gap_to_leader)}</span>
                  )}
                </div>

                <TrackVisibilitySwitch
                  visible={visibleOnTrack}
                  onToggle={() => onToggleDriverTrackVisibility(d.driver_number)}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Driver detail panel */}
      {selected && (
        <div className="flex-1 overflow-y-auto border-t-2 border-[#1e1e2e]">
          {/* Driver header */}
          <div
            className="px-4 py-3 border-b border-[#1e1e2e]"
            style={{ borderLeftColor: teamColor(selected.team_colour), borderLeftWidth: 3 }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-base font-bold text-white truncate">{selected.full_name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{selected.team_name}</div>
              </div>
              {selected.headshot_url && (
                <img
                  src={selected.headshot_url}
                  alt={selected.name_acronym}
                  className="w-11 h-11 rounded-full object-cover shrink-0 bg-[#1a1a2e]"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              )}
            </div>
          </div>

          {/* Live telemetry */}
          {selectedDriverCarData ? (
            <div className="p-3 border-b border-[#1e1e2e]">
              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
                Telemetry
              </div>
              <div className="space-y-1.5">
                <TelemetryBar
                  label="Speed"
                  value={(selectedDriverCarData.speed / 380) * 100}
                  display={`${selectedDriverCarData.speed}`}
                  color={teamColor(selected.team_colour)}
                  unit=" km/h"
                />
                <TelemetryBar
                  label="Throttle"
                  value={selectedDriverCarData.throttle}
                  color="#22c55e"
                  unit="%"
                />
                <TelemetryBar
                  label="Brake"
                  value={selectedDriverCarData.brake > 0 ? 100 : 0}
                  display={selectedDriverCarData.brake > 0 ? 'ON' : 'OFF'}
                  color="#ef4444"
                />
              </div>

              <div className="flex items-center gap-2 mt-2.5">
                <div className="flex-1 bg-[#13131f] rounded-lg px-3 py-2 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Gear</span>
                  <span className="text-sm font-mono font-bold text-white">
                    {selectedDriverCarData.n_gear}
                  </span>
                </div>
                <div className="flex-1 bg-[#13131f] rounded-lg px-3 py-2 flex items-center justify-between">
                  <span className="text-xs text-gray-500">RPM</span>
                  <span className="text-sm font-mono font-bold text-white">
                    {selectedDriverCarData.rpm.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-semibold ${
                    selectedDriverCarData.drs >= 10
                      ? 'bg-green-500/15 text-green-400'
                      : 'bg-gray-700/30 text-gray-500'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      selectedDriverCarData.drs >= 10 ? 'bg-green-400' : 'bg-gray-600'
                    }`}
                  />
                  DRS {selectedDriverCarData.drs >= 10 ? 'OPEN' : 'CLOSED'}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 border-b border-[#1e1e2e]">
              <p className="text-xs text-gray-600 text-center">No telemetry available</p>
            </div>
          )}

          {/* Lap times */}
          <div className="p-3 border-b border-[#1e1e2e]">
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
              Lap Times
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <StatCard label="Last Lap" value={formatLap(lastLap?.lap_duration)} />
              <StatCard
                label="Best Lap"
                value={formatLap(bestLap?.lap_duration)}
                highlight
              />
              <StatCard label="Gap to Leader" value={formatGap(selected.gap_to_leader)} />
              <StatCard label="Interval" value={formatGap(selected.interval)} />
            </div>
          </div>

          {/* Sectors */}
          {lastLap && (
            <div className="p-3">
              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
                Sectors — Lap {lastLap.lap_number}
              </div>
              <div className="space-y-2">
                {([1, 2, 3] as const).map((s) => {
                  const key = `duration_sector_${s}` as keyof Lap;
                  const val = lastLap[key] as number | null;
                  return (
                    <div key={s} className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-600 w-4">S{s}</span>
                      <div className="flex-1 h-1.5 bg-[#13131f] rounded overflow-hidden">
                        <div
                          className="h-full bg-yellow-500/70 rounded"
                          style={{ width: val ? `${Math.min(100, (val / 45) * 100)}%` : '0%' }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-gray-400 w-14 text-right">
                        {val != null ? `${val.toFixed(3)}s` : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-[#13131f] rounded-lg px-3 py-2">
      <div className="text-[10px] text-gray-600 mb-0.5">{label}</div>
      <div
        className={`text-xs font-mono font-semibold ${highlight ? 'text-purple-400' : 'text-white'}`}
      >
        {value}
      </div>
    </div>
  );
}
