import type { CircuitMeta, GeoCircuit } from '../hooks/useCircuitData';
import type { Session, DriverWithData } from '../types/openf1';
import { ToggleAllTrackVisibility, TrackVisibilitySwitch } from './TrackVisibilitySwitch';

interface CircuitInfoPanelProps {
  meta: CircuitMeta | null;
  geo: GeoCircuit | null;
  session: Session | null;
  drivers: DriverWithData[];
  selectedDriverNumber: number | null;
  onSelectDriver: (n: number | null) => void;
  driversHiddenOnTrack: Set<number>;
  allDriversVisibleOnTrack: boolean;
  onToggleAllTrackVisibility: () => void;
  onToggleDriverTrackVisibility: (driverNumber: number) => void;
}

export function CircuitInfoPanel({
  meta,
  geo,
  session,
  drivers,
  selectedDriverNumber,
  onSelectDriver,
  driversHiddenOnTrack,
  allDriversVisibleOnTrack,
  onToggleAllTrackVisibility,
  onToggleDriverTrackVisibility,
}: CircuitInfoPanelProps) {
  return (
    <div
      className="h-full flex flex-col border-l overflow-y-auto"
      style={{ background: 'var(--ios-grouped)', borderColor: 'var(--ios-separator)' }}
    >
      {/* Circuit header */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--ios-separator)' }}>
        <div className="flex items-center gap-2.5 mb-1.5">
          <span
            className="text-[10px] font-bold tracking-widest uppercase"
            style={{ color: 'var(--ios-label-tertiary)' }}
          >
            Circuit
          </span>
        </div>
        {meta ? (
          <>
            <h2 className="text-white font-semibold text-[15px] leading-tight">{meta.circuitName}</h2>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--ios-label-secondary)' }}>
              {meta.locality}, {meta.country}
            </p>
            {meta.url && (
              <a
                href={meta.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] font-medium mt-1 inline-block transition-opacity active:opacity-70"
                style={{ color: 'var(--ios-blue)' }}
              >
                Wikipedia →
              </a>
            )}
          </>
        ) : session ? (
          <>
            <h2 className="text-white font-semibold text-[15px]">{session.location}</h2>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--ios-label-tertiary)' }}>
              Loading circuit data…
            </p>
          </>
        ) : (
          <p className="text-[12px]" style={{ color: 'var(--ios-label-tertiary)' }}>
            No circuit data
          </p>
        )}
      </div>

      {/* Circuit geometry stats */}
      {geo && (
        <div className="p-4 border-b grid grid-cols-2 gap-3" style={{ borderColor: 'var(--ios-separator)' }}>
          <StatCard
            label="Track Points"
            value={geo.coordinates.length.toString()}
          />
          <StatCard
            label="GeoJSON Source"
            value="bacinger/f1-circuits"
            small
          />
          <StatCard
            label="Coordinates"
            value={`${meta?.lat?.toFixed(4) ?? '—'}, ${meta?.lng?.toFixed(4) ?? '—'}`}
            small
          />
          <StatCard
            label="Year"
            value={session?.year?.toString() ?? '—'}
          />
        </div>
      )}

      {/* Session info */}
      {session && (
        <div className="p-4 border-b" style={{ borderColor: 'var(--ios-separator)' }}>
          <p
            className="text-[10px] font-bold tracking-widest uppercase mb-2"
            style={{ color: 'var(--ios-label-tertiary)' }}
          >
            Session
          </p>
          <div className="space-y-1.5">
            <Row label="Name" value={session.session_name} />
            <Row label="Type" value={session.session_type} />
            <Row label="Status" value={session.status} highlight={session.status === 'started'} />
            <Row
              label="Started"
              value={new Date(session.date_start).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            />
          </div>
        </div>
      )}

      {/* Drivers on track */}
      {drivers.length > 0 && (
        <div className="flex-1 p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--ios-label-tertiary)' }}
            >
              Drivers on map
            </p>
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
          <div className="space-y-1.5">
            {drivers
              .filter((d) => d.currentLocation)
              .map((driver) => {
                const isSelected = driver.driver_number === selectedDriverNumber;
                const color = `#${driver.team_colour || 'ffffff'}`;
                const visibleOnTrack = !driversHiddenOnTrack.has(driver.driver_number);
                return (
                  <div
                    key={driver.driver_number}
                    className="flex items-center gap-2.5 rounded-[12px] px-2.5 py-2 transition-colors"
                    style={
                      isSelected
                        ? {
                            background: 'rgba(120,120,128,0.22)',
                            boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.08)',
                          }
                        : { background: 'transparent' }
                    }
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'rgba(120,120,128,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        onSelectDriver(isSelected ? null : driver.driver_number)
                      }
                      className="flex min-w-0 flex-1 items-center gap-3 py-0.5 text-left"
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="w-7 shrink-0 font-mono text-[12px] text-white">
                        {driver.name_acronym}
                      </span>
                      <span
                        className="truncate text-[12px]"
                        style={{ color: 'var(--ios-label-secondary)' }}
                      >
                        {driver.team_name}
                      </span>
                      {driver.position && (
                        <span
                          className="ml-auto shrink-0 text-[10px]"
                          style={{ color: 'var(--ios-label-tertiary)' }}
                        >
                          P{driver.position}
                        </span>
                      )}
                    </button>
                    <TrackVisibilitySwitch
                      visible={visibleOnTrack}
                      onToggle={() => onToggleDriverTrackVisibility(driver.driver_number)}
                    />
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  small,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div
      className="rounded-[12px] px-3 py-2"
      style={{ background: 'var(--ios-grouped-secondary)' }}
    >
      <p className="text-[10px] mb-1" style={{ color: 'var(--ios-label-tertiary)' }}>
        {label}
      </p>
      <p className={`text-white font-semibold ${small ? 'text-[10px]' : 'text-[13px]'} truncate`}>
        {value}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[12px] shrink-0" style={{ color: 'var(--ios-label-secondary)' }}>
        {label}
      </span>
      <span
        className={`text-[12px] truncate text-right ${highlight ? 'font-semibold' : ''}`}
        style={{ color: highlight ? 'var(--ios-green)' : 'rgba(235,235,245,0.92)' }}
      >
        {value}
      </span>
    </div>
  );
}
