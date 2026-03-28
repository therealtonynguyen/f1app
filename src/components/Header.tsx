import type { Session } from '../types/openf1';

type AppMode = 'live' | 'replay' | 'map';

interface Props {
  session: Session | null;
  isLive: boolean;
  isLoading: boolean;
  isLoadingTrack: boolean;
  onRefresh: () => void;
  mode: AppMode;
  onModeChange?: (mode: AppMode) => void;
  /** @deprecated kept for backwards compat; prefer onModeChange */
  onModeToggle?: () => void;
}

export function Header({ session, isLive, isLoading, isLoadingTrack, onRefresh, mode, onModeChange, onModeToggle }: Props) {
  function setMode(m: AppMode) {
    if (onModeChange) onModeChange(m);
    else if (onModeToggle) onModeToggle();
  }

  return (
    <header className="flex items-center justify-between px-4 py-2.5 bg-[#0d0d15] border-b border-[#1e1e2e] shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 select-none">
          <span className="text-red-500 font-black text-xl tracking-tight leading-none">F1</span>
          <span className="text-white font-light text-xl tracking-tight leading-none">TRACK</span>
        </div>

        <div className="w-px h-5 bg-[#2a2a3a]" />

        {session ? (
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-semibold">
              {session.circuit_short_name || session.location}
            </span>
            <span className="text-gray-500 text-sm">{session.session_name}</span>
            <span className="text-gray-600 text-xs">{session.year}</span>
          </div>
        ) : (
          <span className="text-gray-500 text-sm">Loading…</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {isLoadingTrack && mode === 'live' && (
          <span className="text-xs text-gray-600 animate-pulse">Loading track…</span>
        )}

        {/* Mode toggle — 3 tabs */}
        {(onModeChange || onModeToggle) && session && (
          <div className="flex items-center bg-[#13131f] rounded-lg p-1 gap-0.5">
            {(
              [
                { id: 'live', label: 'Live' },
                { id: 'replay', label: 'Replay' },
                { id: 'map', label: 'Map' },
              ] as { id: AppMode; label: string }[]
            ).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  mode === id
                    ? 'bg-[#1e1e35] text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {session && (
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${
              isLive
                ? 'bg-red-500/20 text-red-400'
                : 'bg-gray-700/40 text-gray-400'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLive ? 'bg-red-400 animate-pulse' : 'bg-gray-500'
              }`}
            />
            {isLive ? 'LIVE' : 'HISTORICAL'}
          </div>
        )}

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-gray-400 hover:text-white hover:bg-[#1e1e2e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg
            className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {isLoading ? 'Loading…' : 'Refresh'}
        </button>
      </div>
    </header>
  );
}
