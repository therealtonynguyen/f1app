import { useEffect, useMemo, useRef, useState } from 'react';
import type { DriverWithData, Lap, CarData, Location } from '../types/openf1';
import type { DriverReplayData, ReplayPoint } from '../hooks/useLapReplay';
import { ToggleAllTrackVisibility, TrackVisibilitySwitch } from './TrackVisibilitySwitch';
import { TeamLogoMark } from './TeamLogoMark';
import { metersPerUnitFromTrackOutline, speedKmhFromReplayTrail } from '../lib/locationSpeed';

interface Props {
  drivers: DriverWithData[];
  selectedDriverNumber: number | null;
  onSelectDriver: (n: number | null) => void;
  selectedDriverLaps: Lap[];
  selectedDriverCarData: CarData | null;
  /** Interpolated car telemetry during replay scrubber time. */
  replayCarData?: CarData | null;
  replayMode?: boolean;
  replayDriverData?: DriverReplayData[];
  replayCurrentTime?: number;
  replayTrails?: Map<number, ReplayPoint[]>;
  trackOutline?: Location[];
  driversHiddenOnTrack: Set<number>;
  allDriversVisibleOnTrack: boolean;
  onToggleAllTrackVisibility: () => void;
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

const DETAIL_BUFFER_MS = 1000;

/**
 * Detail values follow telemetry by at most ~1s: when the snapshot key changes,
 * updates apply after a delay, except when switching selected driver (immediate).
 */
function useBufferedDetail<T>(selectedDriverNumber: number | null, snapshotKey: string, value: T): T {
  const [out, setOut] = useState<T>(value);
  const prevDriverRef = useRef<number | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    if (selectedDriverNumber == null) {
      prevDriverRef.current = null;
      setOut(valueRef.current);
      return;
    }
    if (selectedDriverNumber !== prevDriverRef.current) {
      prevDriverRef.current = selectedDriverNumber;
      setOut(valueRef.current);
      return;
    }
    const id = window.setTimeout(() => setOut(valueRef.current), DETAIL_BUFFER_MS);
    return () => window.clearTimeout(id);
  }, [selectedDriverNumber, snapshotKey]);

  return out;
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

function replayGapToLeaderLabel(
  selected: DriverWithData,
  sortedDrivers: DriverWithData[],
  replayByDriver: Map<number, DriverReplayData>,
  replayCurrentTime: number,
  leaderProgress: number
): string {
  const rd = replayByDriver.get(selected.driver_number);
  if (!rd) return '—';
  const idx = sortedDrivers.findIndex((d) => d.driver_number === selected.driver_number);
  if (idx === 0) return 'Leader';
  const progress = lapProgress(rd.bestLap.lap_duration, replayCurrentTime);
  const gapFrac = leaderProgress - progress;
  const gapSec = gapFrac * (rd.bestLap.lap_duration ?? 0);
  return `+${gapSec.toFixed(3)} s`;
}

function replayIntervalLabel(
  selected: DriverWithData,
  sortedDrivers: DriverWithData[],
  replayByDriver: Map<number, DriverReplayData>,
  replayCurrentTime: number
): string {
  const idx = sortedDrivers.findIndex((d) => d.driver_number === selected.driver_number);
  if (idx <= 0) return '—';
  const ahead = sortedDrivers[idx - 1]!;
  const rdSel = replayByDriver.get(selected.driver_number);
  if (!rdSel) return '—';
  const rdAhead = replayByDriver.get(ahead.driver_number);
  const pa = lapProgress(rdAhead?.bestLap.lap_duration, replayCurrentTime);
  const pb = lapProgress(rdSel.bestLap.lap_duration, replayCurrentTime);
  const gapFrac = pa - pb;
  const gapSec = gapFrac * (rdSel.bestLap.lap_duration ?? 0);
  return `+${gapSec.toFixed(3)} s`;
}

export function DriverPanel({
  drivers,
  selectedDriverNumber,
  onSelectDriver,
  selectedDriverLaps,
  selectedDriverCarData,
  replayCarData = null,
  replayMode = false,
  replayDriverData = [],
  replayCurrentTime = 0,
  replayTrails,
  trackOutline = [],
  driversHiddenOnTrack,
  allDriversVisibleOnTrack,
  onToggleAllTrackVisibility,
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

  const effectiveCarDataRaw = replayMode && replayCarData ? replayCarData : selectedDriverCarData;
  const carSnapshotKey = useMemo(() => {
    if (!effectiveCarDataRaw) return '';
    const c = effectiveCarDataRaw;
    return `${c.date}|${c.speed}|${c.throttle}|${c.brake}|${c.rpm}|${c.n_gear}`;
  }, [effectiveCarDataRaw]);
  const bufferedCarData = useBufferedDetail(
    selectedDriverNumber,
    carSnapshotKey,
    effectiveCarDataRaw
  );

  const lapsSnapshotKey = useMemo(() => {
    const last = selectedDriverLaps[selectedDriverLaps.length - 1];
    if (last) {
      return `${selectedDriverLaps.length}|${last.lap_number}|${last.date_start}|${last.lap_duration ?? ''}`;
    }
    return `len:${selectedDriverLaps.length}`;
  }, [selectedDriverLaps]);
  const bufferedDriverLaps = useBufferedDetail(
    selectedDriverNumber,
    lapsSnapshotKey,
    selectedDriverLaps
  );

  const validLaps = bufferedDriverLaps.filter((l) => l.lap_duration != null && !l.is_pit_out_lap);
  const bestLap = [...validLaps].sort((a, b) => (a.lap_duration ?? 0) - (b.lap_duration ?? 0))[0];
  const lastLap = validLaps[validLaps.length - 1];

  const metersPerUnit = useMemo(
    () => metersPerUnitFromTrackOutline(trackOutline),
    [trackOutline]
  );

  const trackSpeedFromGps = useMemo(() => {
    if (!selected) return null;
    if (replayMode && replayTrails) {
      const trail = replayTrails.get(selected.driver_number) ?? [];
      return speedKmhFromReplayTrail(trail, metersPerUnit);
    }
    return selected.trackSpeedKmh ?? null;
  }, [selected, replayMode, replayTrails, metersPerUnit]);

  const gpsSnapshotKey = useMemo(() => {
    if (trackSpeedFromGps == null || !Number.isFinite(trackSpeedFromGps)) return 'none';
    return (Math.round(trackSpeedFromGps * 100) / 100).toFixed(2);
  }, [trackSpeedFromGps]);
  const bufferedTrackSpeed = useBufferedDetail<number | null>(
    selectedDriverNumber,
    gpsSnapshotKey,
    trackSpeedFromGps
  );

  const gapLabel = !selected
    ? '—'
    : replayMode
      ? replayGapToLeaderLabel(selected, sortedDrivers, replayByDriver, replayCurrentTime, leaderProgress)
      : formatGap(selected.gap_to_leader);

  const intervalLabel = !selected
    ? '—'
    : replayMode
      ? replayIntervalLabel(selected, sortedDrivers, replayByDriver, replayCurrentTime)
      : formatGap(selected.interval);

  return (
    <div className="flex flex-col h-full bg-[#0d0d15] border-l border-[#1e1e2e]">
      {/* Driver list */}
      <div className={`overflow-y-auto ${selected ? 'max-h-[45%]' : 'flex-1'}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-[#1e1e2e] bg-[#0d0d15] px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            Drivers
          </span>
          <div className="flex items-center gap-2">
            <ToggleAllTrackVisibility
              allVisible={allDriversVisibleOnTrack}
              onToggle={onToggleAllTrackVisibility}
            />
            <span className="text-[9px] font-medium uppercase tracking-wider text-gray-600">
              Track
            </span>
          </div>
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
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-gray-600">{d.driver_number}</span>
                    <TeamLogoMark teamName={d.team_name} />
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
              <div className="flex min-w-0 items-start gap-2">
                <TeamLogoMark teamName={selected.team_name} className="h-7 w-7 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-base font-bold text-white truncate">{selected.full_name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{selected.team_name}</div>
                </div>
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

          {/* Speed, car telemetry, gap, interval */}
          <div className="p-3 border-b border-[#1e1e2e]">
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
              {replayMode ? 'At this point on track' : 'Live data'}
            </div>
            <div className="space-y-2">
              {bufferedTrackSpeed != null && Number.isFinite(bufferedTrackSpeed) ? (
                <TelemetryBar
                  label="Speed (track GPS)"
                  value={(bufferedTrackSpeed / 380) * 100}
                  display={bufferedTrackSpeed.toFixed(2)}
                  color={teamColor(selected.team_colour)}
                  unit=" km/h"
                />
              ) : (
                <DataRow label="Speed (track GPS)" value="—" />
              )}

              {bufferedCarData ? (
                <>
                  <TelemetryBar
                    label="Speed (car sensor)"
                    value={(bufferedCarData.speed / 380) * 100}
                    display={bufferedCarData.speed.toFixed(2)}
                    color="#94a3b8"
                    unit=" km/h"
                  />
                  <TelemetryBar
                    label="Throttle"
                    value={bufferedCarData.throttle}
                    display={bufferedCarData.throttle.toFixed(2)}
                    color="#22c55e"
                    unit="%"
                  />
                  <TelemetryBar
                    label="Brake"
                    value={bufferedCarData.brake > 0 ? 100 : 0}
                    display={bufferedCarData.brake > 0 ? 'ON' : 'OFF'}
                    color="#ef4444"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <DataRow label="Gear" value={String(bufferedCarData.n_gear)} />
                    <DataRow label="RPM" value={bufferedCarData.rpm.toLocaleString()} />
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-semibold ${
                        bufferedCarData.drs >= 10
                          ? 'bg-green-500/15 text-green-400'
                          : 'bg-gray-700/30 text-gray-500'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          bufferedCarData.drs >= 10 ? 'bg-green-400' : 'bg-gray-600'
                        }`}
                      />
                      DRS {bufferedCarData.drs >= 10 ? 'OPEN' : 'CLOSED'}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-[11px] text-gray-600 py-1">
                  {replayMode
                    ? 'Car telemetry loads for the selected driver’s replay lap…'
                    : 'No car telemetry for this session.'}
                </p>
              )}

              <div className="space-y-2 border-t border-[#1e1e2e] pt-2 mt-1">
                <DataRow label="Gap to leader" value={gapLabel} />
                <DataRow label="Interval" value={intervalLabel} />
              </div>
            </div>
          </div>

          {/* Lap times */}
          <div className="p-3 border-b border-[#1e1e2e]">
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
              Lap times
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <StatCard label="Last lap" value={formatLap(lastLap?.lap_duration)} />
              <StatCard label="Best lap" value={formatLap(bestLap?.lap_duration)} highlight />
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

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-[#13131f] px-3 py-2">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-mono font-semibold text-white text-right">{value}</span>
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
