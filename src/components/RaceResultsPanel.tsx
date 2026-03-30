/**
 * RaceResultsPanel — shown when viewing a completed race session.
 * Displays a podium for P1/P2/P3 with driver photos, then a full results list.
 */
import type { DriverWithData } from '../types/openf1';

interface Props {
  drivers: DriverWithData[];
  session_name: string;
  onSelectDriver: (n: number | null) => void;
  selectedDriverNumber: number | null;
}

const MEDAL = ['🥇', '🥈', '🥉'];
const PODIUM_HEIGHTS = [120, 88, 72]; // px heights for P1, P2, P3 podium blocks

function teamColor(hex: string) {
  return `#${hex || 'ffffff'}`;
}

/** The three podium columns — P2 left, P1 centre, P3 right */
function PodiumBlock({
  driver,
  place,
  height,
  isSelected,
  onClick,
}: {
  driver: DriverWithData;
  place: 1 | 2 | 3;
  height: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const color = teamColor(driver.team_colour);
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-2 transition-transform active:scale-95 focus:outline-none"
      style={{ width: place === 1 ? 96 : 80 }}
    >
      {/* Headshot */}
      <div
        className="relative rounded-full overflow-hidden shrink-0"
        style={{
          width: place === 1 ? 72 : 56,
          height: place === 1 ? 72 : 56,
          border: `2.5px solid ${color}`,
          boxShadow: isSelected
            ? `0 0 0 3px ${color}55, 0 4px 16px ${color}44`
            : `0 4px 12px rgba(0,0,0,0.5)`,
          background: 'var(--ios-grouped-secondary)',
        }}
      >
        {driver.headshot_url ? (
          <img
            src={driver.headshot_url}
            alt={driver.name_acronym}
            className="w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-[14px] font-bold"
            style={{ color }}
          >
            {driver.name_acronym}
          </div>
        )}
      </div>

      {/* Name + medal */}
      <div className="text-center">
        <div className="text-[11px]" style={{ lineHeight: 1 }}>{MEDAL[place - 1]}</div>
        <div
          className="text-[13px] font-bold mt-0.5"
          style={{ color: isSelected ? color : 'var(--ios-label)' }}
        >
          {driver.name_acronym}
        </div>
        <div className="text-[10px] truncate max-w-full" style={{ color: 'var(--ios-label-tertiary)' }}>
          {driver.team_name.replace(' F1 Team', '').replace(' Racing', '')}
        </div>
      </div>

      {/* Podium block */}
      <div
        className="w-full rounded-t-lg flex items-center justify-center"
        style={{
          height,
          background: `linear-gradient(to bottom, ${color}44, ${color}22)`,
          border: `1px solid ${color}55`,
          borderBottom: 'none',
        }}
      >
        <span
          className="text-[28px] font-black"
          style={{ color, opacity: 0.7 }}
        >
          {place}
        </span>
      </div>
    </button>
  );
}

export function RaceResultsPanel({ drivers, session_name, onSelectDriver, selectedDriverNumber }: Props) {
  const sorted = [...drivers]
    .filter((d) => d.position != null)
    .sort((a, b) => (a.position ?? 99) - (b.position ?? 99));

  const p1 = sorted[0];
  const p2 = sorted[1];
  const p3 = sorted[2];
  const rest = sorted.slice(3);

  return (
    <div
      className="flex flex-col h-full border-l overflow-hidden"
      style={{ background: 'var(--ios-grouped)', borderColor: 'var(--ios-separator)' }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 shrink-0 border-b"
        style={{ borderColor: 'var(--ios-separator)' }}
      >
        <p
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--ios-label-tertiary)' }}
        >
          {session_name} · Results
        </p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Podium */}
        {p1 && p2 && p3 ? (
          <div
            className="px-4 pt-5 pb-0 border-b shrink-0"
            style={{ borderColor: 'var(--ios-separator)' }}
          >
            <div className="flex items-end justify-center gap-2">
              {/* P2 — left */}
              <PodiumBlock
                driver={p2}
                place={2}
                height={PODIUM_HEIGHTS[1]}
                isSelected={p2.driver_number === selectedDriverNumber}
                onClick={() => onSelectDriver(p2.driver_number === selectedDriverNumber ? null : p2.driver_number)}
              />
              {/* P1 — centre */}
              <PodiumBlock
                driver={p1}
                place={1}
                height={PODIUM_HEIGHTS[0]}
                isSelected={p1.driver_number === selectedDriverNumber}
                onClick={() => onSelectDriver(p1.driver_number === selectedDriverNumber ? null : p1.driver_number)}
              />
              {/* P3 — right */}
              <PodiumBlock
                driver={p3}
                place={3}
                height={PODIUM_HEIGHTS[2]}
                isSelected={p3.driver_number === selectedDriverNumber}
                onClick={() => onSelectDriver(p3.driver_number === selectedDriverNumber ? null : p3.driver_number)}
              />
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-[13px]" style={{ color: 'var(--ios-label-tertiary)' }}>
            Results not yet available
          </div>
        )}

        {/* Full results list */}
        {sorted.length > 0 && (
          <div>
            <p
              className="px-4 pt-4 pb-2 text-[10px] font-bold uppercase tracking-widest sticky top-0"
              style={{
                color: 'var(--ios-label-tertiary)',
                background: 'var(--ios-grouped)',
              }}
            >
              Classification
            </p>
            {sorted.map((d, idx) => {
              const color = teamColor(d.team_colour);
              const isSelected = d.driver_number === selectedDriverNumber;
              const isPodium = idx < 3;
              return (
                <button
                  key={d.driver_number}
                  type="button"
                  onClick={() => onSelectDriver(isSelected ? null : d.driver_number)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                  style={{
                    borderBottom: '0.5px solid var(--ios-separator)',
                    background: isSelected ? 'rgba(120,120,128,0.18)' : 'transparent',
                  }}
                >
                  {/* Position */}
                  <div
                    className="w-6 shrink-0 text-center text-[13px] font-bold"
                    style={{ color: isPodium ? color : 'var(--ios-label-tertiary)' }}
                  >
                    {isPodium ? MEDAL[idx] : d.position}
                  </div>

                  {/* Team color bar */}
                  <div className="w-0.5 h-7 rounded-full shrink-0" style={{ background: color }} />

                  {/* Headshot */}
                  {d.headshot_url ? (
                    <img
                      src={d.headshot_url}
                      alt={d.name_acronym}
                      className="w-7 h-7 rounded-full object-cover shrink-0"
                      style={{ border: `1.5px solid ${color}` }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div
                      className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold"
                      style={{ background: `${color}22`, color }}
                    >
                      {d.name_acronym.slice(0, 2)}
                    </div>
                  )}

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[13px] font-semibold truncate"
                      style={{ color: isSelected ? color : 'var(--ios-label)' }}
                    >
                      {d.name_acronym}
                    </div>
                    <div className="text-[11px] truncate" style={{ color: 'var(--ios-label-tertiary)' }}>
                      {d.team_name.replace(' F1 Team', '')}
                    </div>
                  </div>

                  {/* Gap */}
                  <div
                    className="text-[11px] font-mono shrink-0 text-right"
                    style={{ color: idx === 0 ? 'var(--ios-orange)' : 'var(--ios-label-secondary)' }}
                  >
                    {idx === 0 ? 'Winner' : (d.gap_to_leader != null ? `+${d.gap_to_leader}` : '—')}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
