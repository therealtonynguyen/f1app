import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useF1Data } from './hooks/useF1Data';
import { useLapReplay } from './hooks/useLapReplay';
import { useCircuitData } from './hooks/useCircuitData';
import { Header } from './components/Header';
import { DriverPanel } from './components/DriverPanel';
import { ReplayControls } from './components/ReplayControls';
import { MapView } from './components/MapView';
import { CircuitInfoPanel } from './components/CircuitInfoPanel';

type AppMode = 'live' | 'replay' | 'map';

export default function App() {
  const [mode, setMode] = useState<AppMode>('live');
  const [driversHiddenOnTrack, setDriversHiddenOnTrack] = useState<Set<number>>(() => new Set());

  const {
    session,
    drivers,
    trackOutline,
    selectedDriverNumber,
    setSelectedDriverNumber,
    selectedDriverLaps,
    selectedDriverCarData,
    isLoading,
    error,
    isLive,
    refresh,
  } = useF1Data();

  const replay = useLapReplay(session?.session_key ?? null, drivers);
  const circuit = useCircuitData(session);

  const validDriverNumbers = useMemo(
    () => new Set(drivers.map((d) => d.driver_number)),
    [drivers]
  );

  const driversHiddenOnTrackResolved = useMemo(() => {
    const next = new Set<number>();
    for (const n of driversHiddenOnTrack) {
      if (validDriverNumbers.has(n)) next.add(n);
    }
    return next;
  }, [driversHiddenOnTrack, validDriverNumbers]);

  const toggleDriverTrackVisibility = useCallback((driverNumber: number) => {
    setDriversHiddenOnTrack((prev) => {
      const next = new Set(prev);
      if (next.has(driverNumber)) next.delete(driverNumber);
      else next.add(driverNumber);
      return next;
    });
  }, []);

  /** Once per session: hide everyone on the map except P1 (or list leader while positions load). */
  const trackVisibilitySeedRef = useRef<{
    sessionKey: number | null;
    phase: 'none' | 'provisional' | 'final';
  }>({ sessionKey: null, phase: 'none' });

  useEffect(() => {
    if (!session || drivers.length === 0) return;
    const sk = session.session_key;
    if (trackVisibilitySeedRef.current.sessionKey !== sk) {
      trackVisibilitySeedRef.current = { sessionKey: sk, phase: 'none' };
    }

    const p1 = drivers.find((d) => d.position === 1);
    const anyPosition = drivers.some((d) => d.position !== undefined);

    if (p1) {
      if (trackVisibilitySeedRef.current.phase !== 'final') {
        trackVisibilitySeedRef.current.phase = 'final';
        setDriversHiddenOnTrack(
          new Set(drivers.map((d) => d.driver_number).filter((n) => n !== p1.driver_number))
        );
      }
      return;
    }

    if (!anyPosition && trackVisibilitySeedRef.current.phase === 'none') {
      trackVisibilitySeedRef.current.phase = 'provisional';
      const top = drivers[0]!.driver_number;
      setDriversHiddenOnTrack(
        new Set(drivers.map((d) => d.driver_number).filter((n) => n !== top))
      );
    }
  }, [session?.session_key, drivers]);

  function handleModeChange(next: AppMode) {
    if (next === 'replay' && replay.driverData.length === 0 && !replay.isLoading) {
      replay.load();
    }
    if (mode === 'replay' && next !== 'replay') {
      replay.pause();
    }
    setMode(next);
  }

  const isReplayMode = mode === 'replay';
  const isMapMode = mode === 'map';

  return (
    <div className="flex flex-col h-screen bg-[#050508] overflow-hidden">
      <Header
        session={session}
        isLive={isLive}
        isLoading={isLoading}
        isLoadingTrack={circuit.isLoading}
        onRefresh={refresh}
        mode={mode}
        onModeChange={session ? handleModeChange : undefined}
      />

      {error ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-4">
            <div className="text-4xl">🏁</div>
            {error.includes('Live F1 session') ? (
              <>
                <h2 className="text-white font-bold text-lg">Live Session In Progress</h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  OpenF1's free tier restricts access to all data while a live session is
                  running. Come back once the session ends — historical data will be freely
                  available again.
                </p>
                <div className="bg-[#1a1a2e] rounded-lg p-3 text-left">
                  <p className="text-xs text-gray-500 mb-1">OpenF1 says:</p>
                  <p className="text-xs text-gray-400 italic">{error}</p>
                </div>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={refresh}
                    disabled={isLoading}
                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm disabled:opacity-40"
                  >
                    {isLoading ? 'Checking…' : 'Try Again'}
                  </button>
                  <a
                    href="https://buy.stripe.com/eVqcN41BPekP0iIalBcEw02"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors text-sm"
                  >
                    Get API Key
                  </a>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-white font-bold text-lg">Connection Error</h2>
                <p className="text-gray-400 text-sm">{error}</p>
                <button
                  onClick={refresh}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm disabled:opacity-40"
                >
                  {isLoading ? 'Retrying…' : 'Retry'}
                </button>
              </>
            )}
          </div>
        </div>
      ) : isLoading && !session ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-600 text-sm">Connecting to OpenF1…</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex flex-1 min-h-0">
            {/* Main view: satellite map + GeoJSON circuit; telemetry overlaid */}
            <div className="flex-1 min-w-0">
              <MapView
                meta={circuit.meta}
                geo={circuit.geo}
                isLoading={circuit.isLoading}
                error={circuit.error}
                drivers={drivers}
                trackOutline={trackOutline}
                selectedDriverNumber={selectedDriverNumber}
                onSelectDriver={setSelectedDriverNumber}
                driversHiddenOnTrack={driversHiddenOnTrackResolved}
                replayPositions={isReplayMode ? replay.positions : undefined}
                replayTrails={isReplayMode ? replay.trails : undefined}
              />
            </div>

            {/* Right panel */}
            <div className="w-72 shrink-0 flex flex-col min-h-0">
              {isMapMode ? (
                <CircuitInfoPanel
                  meta={circuit.meta}
                  geo={circuit.geo}
                  session={session}
                  drivers={drivers}
                  selectedDriverNumber={selectedDriverNumber}
                  onSelectDriver={setSelectedDriverNumber}
                  driversHiddenOnTrack={driversHiddenOnTrackResolved}
                  onToggleDriverTrackVisibility={toggleDriverTrackVisibility}
                />
              ) : (
                <DriverPanel
                  drivers={drivers}
                  selectedDriverNumber={selectedDriverNumber}
                  onSelectDriver={setSelectedDriverNumber}
                  selectedDriverLaps={selectedDriverLaps}
                  selectedDriverCarData={selectedDriverCarData}
                  replayMode={isReplayMode}
                  replayDriverData={replay.driverData}
                  replayCurrentTime={replay.currentTime}
                  driversHiddenOnTrack={driversHiddenOnTrackResolved}
                  onToggleDriverTrackVisibility={toggleDriverTrackVisibility}
                />
              )}
            </div>
          </div>

          {/* Replay Controls */}
          {isReplayMode && (
            <ReplayControls
              driverData={replay.driverData}
              currentTime={replay.currentTime}
              maxDuration={replay.maxDuration}
              isPlaying={replay.isPlaying}
              speed={replay.speed}
              isLoading={replay.isLoading}
              progress={replay.progress}
              loadingLabel={replay.loadingLabel}
              error={replay.error}
              onPlay={replay.play}
              onPause={replay.pause}
              onReset={replay.reset}
              onSeek={replay.seek}
              onSpeedChange={replay.setSpeed}
            />
          )}
        </div>
      )}
    </div>
  );
}
