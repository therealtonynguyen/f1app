import type { CircuitMeta, GeoCircuit } from '../hooks/useCircuitData';
import type { Session, DriverWithData } from '../types/openf1';
import { TrackVisibilitySwitch } from './TrackVisibilitySwitch';

interface CircuitInfoPanelProps {
  meta: CircuitMeta | null;
  geo: GeoCircuit | null;
  session: Session | null;
  drivers: DriverWithData[];
  selectedDriverNumber: number | null;
  onSelectDriver: (n: number | null) => void;
  driversHiddenOnTrack: Set<number>;
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
  onToggleDriverTrackVisibility,
}: CircuitInfoPanelProps) {
  return (
    <div className="h-full flex flex-col bg-[#0d0d1a] border-l border-white/5 overflow-y-auto">
      {/* Circuit header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold tracking-widest text-red-500 uppercase">Circuit Info</span>
        </div>
        {meta ? (
          <>
            <h2 className="text-white font-bold text-sm leading-tight">{meta.circuitName}</h2>
            <p className="text-gray-400 text-xs mt-0.5">
              {meta.locality}, {meta.country}
            </p>
            {meta.url && (
              <a
                href={meta.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-red-400/80 hover:text-red-400 mt-1 inline-block transition-colors"
              >
                Wikipedia →
              </a>
            )}
          </>
        ) : session ? (
          <>
            <h2 className="text-white font-bold text-sm">{session.location}</h2>
            <p className="text-gray-500 text-xs mt-0.5">Loading circuit data…</p>
          </>
        ) : (
          <p className="text-gray-500 text-xs">No circuit data</p>
        )}
      </div>

      {/* Circuit geometry stats */}
      {geo && (
        <div className="p-4 border-b border-white/5 grid grid-cols-2 gap-3">
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
        <div className="p-4 border-b border-white/5">
          <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-2">Session</p>
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
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Drivers on Map
            </p>
            <span className="text-[9px] font-medium uppercase tracking-wider text-gray-600">
              Track
            </span>
          </div>
          <div className="space-y-1">
            {drivers
              .filter((d) => d.currentLocation)
              .map((driver) => {
                const isSelected = driver.driver_number === selectedDriverNumber;
                const color = `#${driver.team_colour || 'ffffff'}`;
                const visibleOnTrack = !driversHiddenOnTrack.has(driver.driver_number);
                return (
                  <div
                    key={driver.driver_number}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1 transition-all ${
                      isSelected ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/5'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        onSelectDriver(isSelected ? null : driver.driver_number)
                      }
                      className="flex min-w-0 flex-1 items-center gap-2.5 py-0.5 text-left"
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="w-6 shrink-0 font-mono text-xs text-gray-300">
                        {driver.name_acronym}
                      </span>
                      <span className="truncate text-xs text-gray-500">{driver.team_name}</span>
                      {driver.position && (
                        <span className="ml-auto shrink-0 text-[10px] text-gray-600">
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
    <div className="bg-white/5 rounded-lg px-3 py-2">
      <p className="text-[10px] text-gray-500 mb-0.5">{label}</p>
      <p className={`text-white font-semibold ${small ? 'text-[10px]' : 'text-sm'} truncate`}>
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
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <span
        className={`text-xs truncate text-right ${
          highlight ? 'text-green-400 font-semibold' : 'text-gray-300'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
