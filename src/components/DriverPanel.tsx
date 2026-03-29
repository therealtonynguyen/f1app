import { useMemo } from 'react';
import type { DriverWithData, Lap, CarData, Location } from '../types/openf1';
import type { DriverReplayData, ReplayPoint } from '../hooks/useLapReplay';
import { ToggleAllTrackVisibility, TrackVisibilitySwitch } from './TrackVisibilitySwitch';
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
    <div className="rounded-[12px] p-3" style={{ background: 'var(--ios-grouped-secondary)' }}>
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <span className="text-[12px]" style={{ color: 'var(--ios-label-secondary)' }}>
          {label}
        </span>
        <span className="text-[12px] font-mono font-semibold text-white shrink-0 text-right">
          {display ?? value}
          {unit && (
            <span className="ml-1" style={{ color: 'var(--ios-label-tertiary)' }}>
              {unit}
            </span>
          )}
        </span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--ios-grouped-tertiary)' }}>
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

  const effectiveCarData = replayMode && replayCarData ? replayCarData : selectedDriverCarData;

  const validLaps = selectedDriverLaps.filter((l) => l.lap_duration != null && !l.is_pit_out_lap);
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
    <div
      className="flex flex-col h-full border-l"
      style={{ background: 'var(--ios-grouped)', borderColor: 'var(--ios-separator)' }}
    >
      {/* Driver list */}
      <div className={`overflow-y-auto ${selected ? 'max-h-[45%]' : 'flex-1'}`}>
        <div
          className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b px-3 py-2.5"
          style={{
            borderColor: 'var(--ios-separator)',
            background: 'var(--ios-grouped)',
          }}
        >
          <span
            className="text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: 'var(--ios-label-tertiary)' }}
          >
            Drivers
          </span>
          <div className="flex items-center gap-3">
            <ToggleAllTrackVisibility
              allVisible={allDriversVisibleOnTrack}
              onToggle={onToggleAllTrackVisibility}
            />
            <span
              className="text-[9px] font-medium uppercase tracking-wider"
              style={{ color: 'var(--ios-label-tertiary)' }}
            >
              Track
            </span>
          </div>
        </div>

        {sortedDrivers.length === 0 ? (
          <div className="p-4 text-center text-[13px]" style={{ color: 'var(--ios-label-tertiary)' }}>
            No driver data
          </div>
        ) : (
          sortedDrivers.map((d) => {
            const active = d.driver_number === selectedDriverNumber;
            const color = teamColor(d.team_colour);
            const visibleOnTrack = !driversHiddenOnTrack.has(d.driver_number);
            return (
              <div
                key={d.driver_number}
                onClick={() => onSelectDriver(active ? null : d.driver_number)}
                className={`flex cursor-pointer items-center gap-2.5 border-b px-3 py-2.5 transition-colors ${
                  active
                    ? 'bg-[rgba(120,120,128,0.18)]'
                    : 'hover:bg-[rgba(120,120,128,0.08)]'
                }`}
                style={{ borderColor: 'rgba(84,84,88,0.35)' }}
              >
                {/* Position / rank */}
                <div
                  className="w-5 shrink-0 text-center text-[12px] font-bold"
                  style={{ color: 'var(--ios-label-tertiary)' }}
                >
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
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="text-[10px] font-mono shrink-0"
                      style={{ color: 'var(--ios-label-tertiary)' }}
                    >
                      {d.driver_number}
                    </span>
                    <span
                      className={`text-[15px] font-semibold truncate min-w-0 ${active ? 'text-white' : ''}`}
                      style={!active ? { color: 'rgba(235,235,245,0.92)' } : undefined}
                    >
                      {d.name_acronym}
                    </span>
                  </div>
                  <div
                    className="text-[11px] truncate"
                    style={{ color: 'var(--ios-label-secondary)' }}
                  >
                    {d.team_name}
                  </div>
                </div>

                {/* Gap to leader (replay) or race gap (live) */}
                <div className="shrink-0 text-[11px] font-mono pl-1">
                  {replayMode ? (() => {
                    const rd = replayByDriver.get(d.driver_number);
                    if (!rd) return <span style={{ color: 'var(--ios-label-tertiary)' }}>—</span>;
                    const progress = lapProgress(rd.bestLap.lap_duration, replayCurrentTime);
                    const rank = sortedDrivers.indexOf(d);
                    if (rank === 0)
                      return (
                        <span className="font-semibold" style={{ color: 'var(--ios-orange)' }}>
                          Leader
                        </span>
                      );
                    // Gap = how far behind the leader in fractional seconds
                    const gapFrac = leaderProgress - progress;
                    const gapSec = gapFrac * (rd.bestLap.lap_duration ?? 0);
                    return (
                      <span style={{ color: 'var(--ios-label-secondary)' }}>
                        +{gapSec.toFixed(3)}s
                      </span>
                    );
                  })() : (
                    <span style={{ color: 'var(--ios-label-secondary)' }}>
                      {formatGap(d.gap_to_leader)}
                    </span>
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
        <div
          className="flex-1 overflow-y-auto border-t"
          style={{ borderColor: 'var(--ios-separator)', borderTopWidth: 2 }}
        >
          {/* Driver header */}
          <div
            className="px-4 py-3 border-b"
            style={{
              borderColor: 'var(--ios-separator)',
              borderLeftColor: teamColor(selected.team_colour),
              borderLeftWidth: 3,
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[17px] font-semibold text-white truncate leading-tight">
                  {selected.full_name}
                </div>
                <div
                  className="text-[12px] mt-0.5"
                  style={{ color: 'var(--ios-label-secondary)' }}
                >
                  {selected.team_name}
                </div>
              </div>
              {selected.headshot_url && (
                <img
                  src={selected.headshot_url}
                  alt={selected.name_acronym}
                  className="w-12 h-12 rounded-full object-cover shrink-0 ring-2 ring-white/20 ml-1"
                  style={{ background: 'var(--ios-grouped-tertiary)' }}
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              )}
            </div>
          </div>

          {/* Speed, car telemetry, gap, interval */}
          <div className="p-3 border-b" style={{ borderColor: 'var(--ios-separator)' }}>
            <div
              className="text-[11px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: 'var(--ios-label-tertiary)' }}
            >
              {replayMode ? 'At this point on track' : 'Live data'}
            </div>
            <div className="space-y-2">
              {trackSpeedFromGps != null && Number.isFinite(trackSpeedFromGps) ? (
                <TelemetryBar
                  label="Speed (track GPS)"
                  value={(trackSpeedFromGps / 380) * 100}
                  display={trackSpeedFromGps.toFixed(1)}
                  color={teamColor(selected.team_colour)}
                  unit=" km/h"
                />
              ) : (
                <DataRow label="Speed (track GPS)" value="—" />
              )}

              {effectiveCarData ? (
                <>
                  <TelemetryBar
                    label="Speed (car sensor)"
                    value={(effectiveCarData.speed / 380) * 100}
                    display={effectiveCarData.speed.toFixed(1)}
                    color="#94a3b8"
                    unit=" km/h"
                  />
                  <TelemetryBar
                    label="Throttle"
                    value={effectiveCarData.throttle}
                    display={effectiveCarData.throttle.toFixed(1)}
                    color="#22c55e"
                    unit="%"
                  />
                  <TelemetryBar
                    label="Brake"
                    value={effectiveCarData.brake > 0 ? 100 : 0}
                    display={effectiveCarData.brake > 0 ? 'ON' : 'OFF'}
                    color="#ef4444"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <DataRow label="Gear" value={String(effectiveCarData.n_gear)} />
                    <DataRow label="RPM" value={effectiveCarData.rpm.toLocaleString()} />
                  </div>
                  <div>
                    <span
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold"
                      style={
                        effectiveCarData.drs >= 10
                          ? { background: 'rgba(48,209,88,0.2)', color: 'var(--ios-green)' }
                          : {
                              background: 'var(--ios-fill)',
                              color: 'var(--ios-label-tertiary)',
                            }
                      }
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background:
                            effectiveCarData.drs >= 10
                              ? 'var(--ios-green)'
                              : 'var(--ios-grouped-tertiary)',
                        }}
                      />
                      DRS {effectiveCarData.drs >= 10 ? 'OPEN' : 'CLOSED'}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-[12px] py-1" style={{ color: 'var(--ios-label-tertiary)' }}>
                  {replayMode
                    ? 'Car telemetry loads for the selected driver’s replay lap…'
                    : 'No car telemetry for this session.'}
                </p>
              )}

              <div
                className="space-y-2 border-t pt-2 mt-1"
                style={{ borderColor: 'var(--ios-separator)' }}
              >
                <DataRow label="Gap to leader" value={gapLabel} />
                <DataRow label="Interval" value={intervalLabel} />
              </div>
            </div>
          </div>

          {/* Lap times */}
          <div className="p-3 border-b" style={{ borderColor: 'var(--ios-separator)' }}>
            <div
              className="text-[11px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: 'var(--ios-label-tertiary)' }}
            >
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
              <div
                className="text-[11px] font-semibold uppercase tracking-widest mb-2"
                style={{ color: 'var(--ios-label-tertiary)' }}
              >
                Sectors — Lap {lastLap.lap_number}
              </div>
              <div className="space-y-2">
                {([1, 2, 3] as const).map((s) => {
                  const key = `duration_sector_${s}` as keyof Lap;
                  const val = lastLap[key] as number | null;
                  return (
                    <div key={s} className="flex items-center gap-3">
                      <span
                        className="text-[10px] w-5 shrink-0"
                        style={{ color: 'var(--ios-label-tertiary)' }}
                      >
                        S{s}
                      </span>
                      <div
                        className="flex-1 h-1.5 rounded-full overflow-hidden min-w-0"
                        style={{ background: 'var(--ios-grouped-tertiary)' }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            background: 'var(--ios-orange)',
                            opacity: 0.85,
                            width: val ? `${Math.min(100, (val / 45) * 100)}%` : '0%',
                          }}
                        />
                      </div>
                      <span
                        className="text-[11px] font-mono w-14 shrink-0 text-right pl-1"
                        style={{ color: 'var(--ios-label-secondary)' }}
                      >
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
    <div
      className="flex items-center justify-between gap-3 rounded-[10px] px-3 py-2.5"
      style={{ background: 'var(--ios-grouped-secondary)' }}
    >
      <span className="text-[12px]" style={{ color: 'var(--ios-label-secondary)' }}>
        {label}
      </span>
      <span className="text-[12px] font-mono font-semibold text-white text-right">{value}</span>
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
    <div
      className="rounded-[10px] px-3 py-2"
      style={{ background: 'var(--ios-grouped-secondary)' }}
    >
      <div className="text-[10px] mb-1" style={{ color: 'var(--ios-label-tertiary)' }}>
        {label}
      </div>
      <div
        className="text-[12px] font-mono font-semibold"
        style={{ color: highlight ? 'var(--ios-blue)' : '#fff' }}
      >
        {value}
      </div>
    </div>
  );
}
