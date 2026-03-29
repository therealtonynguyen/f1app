import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import type { DriverReplayData } from '../hooks/useLapReplay';
import type { ReplayCarSeries } from '../hooks/useAllDriversReplayCarSeries';
import {
  carSeriesToPath,
  playheadX,
  TELEMETRY_CHART_PX_HEIGHT,
  TELEMETRY_CHART_VB,
} from '../lib/telemetrySeriesPath';

type Props = {
  driverData: DriverReplayData[];
  seriesByDriver: Map<number, ReplayCarSeries>;
  seriesLoading: boolean;
  seriesError: string | null;
  currentTime: number;
  maxDuration: number;
  replayLoading?: boolean;
  expandedDriverNumber: number | null;
  onExpandedDriverChange: (driverNumber: number | null) => void;
  /** Renders track map for the expanded driver (replay dot + trail). */
  renderExpandedTrackMap: (driverNumber: number) => ReactNode;
};

function AxisLabelsSide() {
  return (
    <div
      className="flex flex-col justify-between shrink-0 w-9 text-[9px] font-medium tabular-nums leading-none py-px"
      style={{
        height: TELEMETRY_CHART_PX_HEIGHT,
        color: 'var(--ios-label-tertiary)',
      }}
    >
      <span className="text-right">100%</span>
      <span className="text-right">50%</span>
      <span className="text-right">0%</span>
    </div>
  );
}

function AxisLabelsSideRight() {
  return (
    <div
      className="flex flex-col justify-between shrink-0 w-9 text-[9px] font-medium tabular-nums leading-none py-px"
      style={{
        height: TELEMETRY_CHART_PX_HEIGHT,
        color: 'var(--ios-label-tertiary)',
      }}
    >
      <span className="text-left">100%</span>
      <span className="text-left">50%</span>
      <span className="text-left">0%</span>
    </div>
  );
}

function MiniChart({
  label,
  pathD,
  stroke,
  currentTime,
  maxDuration,
}: {
  label: string;
  pathD: string;
  stroke: string;
  currentTime: number;
  maxDuration: number;
}) {
  const px = playheadX(currentTime, maxDuration);
  const { w, h } = TELEMETRY_CHART_VB;

  return (
    <div>
      <div
        className="text-[10px] font-semibold uppercase tracking-wider mb-1"
        style={{ color: 'var(--ios-label-tertiary)' }}
      >
        {label}
      </div>
      <div className="flex gap-1.5 items-stretch">
        <AxisLabelsSide />
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="flex-1 min-w-0 rounded-md"
          style={{
            height: TELEMETRY_CHART_PX_HEIGHT,
            background: 'var(--ios-grouped-secondary)',
          }}
          preserveAspectRatio="none"
        >
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={stroke}
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}
          {maxDuration > 0 && (
            <line
              x1={px}
              y1={0}
              x2={px}
              y2={h}
              stroke="rgba(255,255,255,0.88)"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
        <AxisLabelsSideRight />
      </div>
    </div>
  );
}

function DriverTelemetryCard({
  entry,
  series,
  currentTime,
  maxDuration,
  seriesLoading,
  expanded,
  onToggleExpand,
  renderExpandedTrackMap,
}: {
  entry: DriverReplayData;
  series: ReplayCarSeries | undefined;
  currentTime: number;
  maxDuration: number;
  seriesLoading: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  renderExpandedTrackMap: (driverNumber: number) => ReactNode;
}) {
  const { driver, bestLap } = entry;
  const teamHex = driver.team_colour || 'ffffff';
  const teamColor = `#${teamHex}`;
  const samples = series?.samples ?? [];
  const lapStart = series?.lapDateStart ?? bestLap.date_start;
  const articleRef = useRef<HTMLElement>(null);

  const throttlePath = useMemo(
    () => carSeriesToPath(samples, lapStart, maxDuration, 'throttle'),
    [samples, lapStart, maxDuration]
  );
  const brakePath = useMemo(
    () => carSeriesToPath(samples, lapStart, maxDuration, 'brake'),
    [samples, lapStart, maxDuration]
  );

  useEffect(() => {
    if (!expanded) return;
    articleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [expanded]);

  return (
    <article
      ref={articleRef}
      className={`rounded-[14px] overflow-hidden border flex flex-col transition-[box-shadow] duration-200 ${
        expanded ? 'col-span-full ring-1 ring-white/15 shadow-lg' : ''
      }`}
      style={{
        background: 'var(--ios-grouped)',
        borderColor: expanded ? `${teamColor}88` : 'rgba(84,84,88,0.5)',
        boxShadow: expanded ? undefined : `inset 3px 0 0 0 ${teamColor}`,
      }}
    >
      <button
        type="button"
        onClick={onToggleExpand}
        className="flex w-full items-center gap-3 px-3 py-2.5 border-b text-left transition-colors hover:bg-white/[0.04]"
        style={{ borderColor: 'var(--ios-separator)' }}
        aria-expanded={expanded}
      >
        <span
          className="text-[11px] w-5 shrink-0 tabular-nums"
          style={{ color: 'var(--ios-label-tertiary)' }}
          aria-hidden
        >
          {expanded ? '▼' : '▶'}
        </span>
        {driver.headshot_url ? (
          <img
            src={driver.headshot_url}
            alt=""
            className="w-11 h-11 rounded-full object-cover shrink-0"
            style={{ boxShadow: `0 0 0 2px ${teamColor}66` }}
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div
            className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center text-[13px] font-bold text-white/90"
            style={{ background: `${teamColor}44` }}
          >
            {driver.name_acronym}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-[16px] font-semibold text-white truncate leading-tight">{driver.full_name}</div>
          <div className="text-[12px] mt-0.5 truncate" style={{ color: 'var(--ios-label-secondary)' }}>
            <span className="font-mono text-white/90">{driver.name_acronym}</span>
            <span className="mx-1.5 opacity-40">·</span>
            <span style={{ color: teamColor }}>{driver.team_name}</span>
          </div>
        </div>
        <span className="text-[10px] shrink-0 uppercase tracking-wide" style={{ color: 'var(--ios-label-tertiary)' }}>
          {expanded ? 'Hide map' : 'Track map'}
        </span>
      </button>

      <div className="p-3 space-y-3">
        {samples.length === 0 && seriesLoading ? (
          <p className="text-[12px] py-2" style={{ color: 'var(--ios-label-tertiary)' }}>
            Loading telemetry…
          </p>
        ) : samples.length === 0 ? (
          <p className="text-[12px] py-2" style={{ color: 'var(--ios-label-tertiary)' }}>
            No car telemetry for this lap.
          </p>
        ) : (
          <>
            <MiniChart
              label="Throttle"
              pathD={throttlePath}
              stroke="#22c55e"
              currentTime={currentTime}
              maxDuration={maxDuration}
            />
            <MiniChart
              label="Brake"
              pathD={brakePath}
              stroke="#ef4444"
              currentTime={currentTime}
              maxDuration={maxDuration}
            />
          </>
        )}
      </div>

      {expanded && (
        <div
          className="border-t flex flex-col min-h-0"
          style={{ borderColor: 'var(--ios-separator)' }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="presentation"
        >
          <div
            className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--ios-label-tertiary)', background: 'var(--ios-grouped-secondary)' }}
          >
            Position on lap — {driver.name_acronym}
          </div>
          <div className="relative w-full h-[min(42vh,340px)] min-h-[200px] bg-black">
            {renderExpandedTrackMap(driver.driver_number)}
          </div>
        </div>
      )}
    </article>
  );
}

export function DriverTelemetryGraphs({
  driverData,
  seriesByDriver,
  seriesLoading,
  seriesError,
  currentTime,
  maxDuration,
  replayLoading = false,
  expandedDriverNumber,
  onExpandedDriverChange,
  renderExpandedTrackMap,
}: Props) {
  const sorted = useMemo(
    () =>
      [...driverData].sort(
        (a, b) => (a.bestLap.lap_duration ?? 0) - (b.bestLap.lap_duration ?? 0)
      ),
    [driverData]
  );

  if (replayLoading && driverData.length === 0) {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center gap-3 p-8"
        style={{ background: 'var(--ios-bg)' }}
      >
        <div
          className="w-8 h-8 rounded-full border-2 border-transparent animate-spin"
          style={{
            borderTopColor: 'var(--ios-blue)',
            borderRightColor: 'rgba(255,255,255,0.12)',
          }}
        />
        <p className="text-[15px]" style={{ color: 'var(--ios-label-secondary)' }}>
          Loading lap data…
        </p>
      </div>
    );
  }

  if (driverData.length === 0) {
    return (
      <div
        className="flex flex-1 items-center justify-center p-8 text-[15px]"
        style={{ color: 'var(--ios-label-secondary)', background: 'var(--ios-bg)' }}
      >
        No lap data yet. Open Replay or Graphs again after the session loads.
      </div>
    );
  }

  return (
    <div
      className="flex flex-1 flex-col min-h-0 overflow-hidden"
      style={{ background: 'var(--ios-bg)' }}
    >
      {(seriesLoading || seriesError) && (
        <div
          className="shrink-0 px-4 py-2 text-[13px] border-b"
          style={{
            borderColor: 'var(--ios-separator)',
            color: seriesError ? 'var(--ios-red)' : 'var(--ios-label-secondary)',
            background: 'var(--ios-grouped)',
          }}
        >
          {seriesError ?? 'Loading throttle & brake traces for all drivers…'}
        </div>
      )}

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3 max-w-[1600px] mx-auto">
          {sorted.map((entry) => {
            const num = entry.driver.driver_number;
            const expanded = expandedDriverNumber === num;
            return (
              <DriverTelemetryCard
                key={num}
                entry={entry}
                series={seriesByDriver.get(num)}
                currentTime={currentTime}
                maxDuration={maxDuration}
                seriesLoading={seriesLoading}
                expanded={expanded}
                onToggleExpand={() => {
                  onExpandedDriverChange(expanded ? null : num);
                }}
                renderExpandedTrackMap={renderExpandedTrackMap}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
