import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useF1Data } from './hooks/useF1Data';
import { useLapReplay } from './hooks/useLapReplay';
import { useReplayCarTelemetry } from './hooks/useReplayCarTelemetry';
import { useCircuitData } from './hooks/useCircuitData';
import { Header } from './components/Header';
import { DriverPanel } from './components/DriverPanel';
import { ReplayControls } from './components/ReplayControls';
import { MapView } from './components/MapView';
import { CircuitInfoPanel } from './components/CircuitInfoPanel';
import { DriverTelemetryGraphs } from './components/DriverTelemetryGraphs';
import { SessionPicker } from './components/SessionPicker';
import { useAllDriversReplayCarSeries } from './hooks/useAllDriversReplayCarSeries';
import type { AppMode } from './types/appMode';

export type { AppMode };

export default function App() {
  const [mode, setMode] = useState<AppMode>('live');
  const [driversPanelOpen, setDriversPanelOpen] = useState(true);
  const [replayBarVisible, setReplayBarVisible] = useState(true);
  const [driversHiddenOnTrack, setDriversHiddenOnTrack] = useState<Set<number>>(() => new Set());
  const [graphsExpandedDriver, setGraphsExpandedDriver] = useState<number | null>(null);
  const [sessionPickerOpen, setSessionPickerOpen] = useState(false);

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
    loadSession,
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

  const allDriversVisibleOnTrack = useMemo(() => {
    if (drivers.length === 0) return true;
    return drivers.every((d) => !driversHiddenOnTrackResolved.has(d.driver_number));
  }, [drivers, driversHiddenOnTrackResolved]);

  const toggleAllTrackVisibility = useCallback(() => {
    if (drivers.length === 0) return;
    if (allDriversVisibleOnTrack) {
      setDriversHiddenOnTrack(new Set(drivers.map((d) => d.driver_number)));
    } else {
      setDriversHiddenOnTrack(new Set());
    }
  }, [drivers, allDriversVisibleOnTrack]);

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
    if (
      (next === 'replay' || next === 'graphs') &&
      replay.driverData.length === 0 &&
      !replay.isLoading
    ) {
      replay.load();
    }
    if ((mode === 'replay' || mode === 'graphs') && next !== 'replay' && next !== 'graphs') {
      replay.pause();
    }
    setMode(next);
  }

  const isReplayMode = mode === 'replay';
  const isGraphsMode = mode === 'graphs';
  const isReplayLikeMode = isReplayMode || isGraphsMode;
  const isMapMode = mode === 'map';

  useEffect(() => {
    if (!isGraphsMode) setGraphsExpandedDriver(null);
  }, [isGraphsMode]);

  /** Graphs expanded map: only the selected driver’s dot + trail visible. */
  const graphsSoloHidden = useMemo(() => {
    if (graphsExpandedDriver == null) return driversHiddenOnTrackResolved;
    return new Set(drivers.map((d) => d.driver_number).filter((n) => n !== graphsExpandedDriver));
  }, [graphsExpandedDriver, drivers, driversHiddenOnTrackResolved]);

  const { seriesByDriver, loading: carSeriesLoading, error: carSeriesError } =
    useAllDriversReplayCarSeries(
      session?.session_key ?? null,
      replay.driverData,
      isGraphsMode && replay.driverData.length > 0
    );

  const replayCarData = useReplayCarTelemetry(
    session?.session_key ?? null,
    selectedDriverNumber,
    replay.driverData,
    replay.currentTime,
    isReplayLikeMode
  );

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: 'var(--ios-bg)' }}
    >
      <Header
        session={session}
        isLive={isLive}
        isLoading={isLoading}
        isLoadingTrack={circuit.isLoading}
        onRefresh={refresh}
        onOpenSessionPicker={() => setSessionPickerOpen(true)}
        mode={mode}
        onModeChange={session ? handleModeChange : undefined}
      />

      {sessionPickerOpen && (
        <SessionPicker
          currentSessionKey={session?.session_key}
          onSelect={(sessionKey) => {
            // Reset replay when switching sessions
            replay.pause();
            setMode('live');
            loadSession(sessionKey);
          }}
          onClose={() => setSessionPickerOpen(false)}
        />
      )}

      {error ? (
        <div
          className="flex-1 flex items-center justify-center p-6"
          style={{
            paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
          }}
        >
          <div className="ios-group max-w-md text-center space-y-5 p-6">
            <div className="text-3xl pb-1" aria-hidden>
              🏁
            </div>
            {error.includes('Live F1 session') ? (
              <>
                <h2 className="text-[20px] font-semibold text-white leading-snug">
                  Live session in progress
                </h2>
                <p className="text-[15px] leading-relaxed" style={{ color: 'var(--ios-label-secondary)' }}>
                  OpenF1&apos;s free tier restricts access while a live session is running. Historical
                  data is available again after the session ends.
                </p>
                <div
                  className="rounded-[10px] p-3 text-left"
                  style={{ background: 'var(--ios-grouped-secondary)' }}
                >
                  <p className="text-[11px] font-medium mb-1" style={{ color: 'var(--ios-label-tertiary)' }}>
                    OpenF1
                  </p>
                  <p className="text-[13px] italic" style={{ color: 'var(--ios-label-secondary)' }}>
                    {error}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    type="button"
                    onClick={refresh}
                    disabled={isLoading}
                    className="ios-cta disabled:opacity-40"
                    style={{ background: 'var(--ios-blue)', color: '#fff' }}
                  >
                    {isLoading ? 'Checking…' : 'Try again'}
                  </button>
                  <a
                    href="https://buy.stripe.com/eVqcN41BPekP0iIalBcEw02"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ios-cta inline-block"
                    style={{
                      background: 'var(--ios-fill)',
                      color: 'var(--ios-orange)',
                    }}
                  >
                    Get API key
                  </a>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-[20px] font-semibold text-white">Connection error</h2>
                <p className="text-[15px]" style={{ color: 'var(--ios-label-secondary)' }}>
                  {error}
                </p>
                <button
                  type="button"
                  onClick={refresh}
                  disabled={isLoading}
                  className="ios-cta disabled:opacity-40"
                  style={{ background: 'var(--ios-blue)', color: '#fff' }}
                >
                  {isLoading ? 'Retrying…' : 'Retry'}
                </button>
              </>
            )}
          </div>
        </div>
      ) : isLoading && !session ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div
              className="w-9 h-9 rounded-full animate-spin border-2 border-transparent mx-auto mb-0.5"
              style={{
                borderTopColor: 'var(--ios-blue)',
                borderRightColor: 'rgba(255,255,255,0.15)',
              }}
            />
            <p className="text-[15px] font-medium" style={{ color: 'var(--ios-label-secondary)' }}>
              Connecting…
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex min-h-0 flex-1">
            {/* Main view: satellite map + GeoJSON circuit; telemetry overlaid */}
            <div className="relative min-w-0 flex-1 bg-black min-h-0 flex flex-col">
              {isGraphsMode ? (
                <DriverTelemetryGraphs
                  driverData={replay.driverData}
                  seriesByDriver={seriesByDriver}
                  seriesLoading={carSeriesLoading}
                  seriesError={carSeriesError}
                  currentTime={replay.currentTime}
                  maxDuration={replay.maxDuration}
                  replayLoading={replay.isLoading}
                  expandedDriverNumber={graphsExpandedDriver}
                  onExpandedDriverChange={(n) => {
                    setGraphsExpandedDriver(n);
                    if (n != null) setSelectedDriverNumber(n);
                  }}
                  renderExpandedTrackMap={(driverNumber) => (
                    <MapView
                      key={driverNumber}
                      meta={circuit.meta}
                      geo={circuit.geo}
                      isLoading={circuit.isLoading}
                      error={circuit.error}
                      drivers={drivers}
                      trackOutline={trackOutline}
                      selectedDriverNumber={driverNumber}
                      onSelectDriver={setSelectedDriverNumber}
                      driversHiddenOnTrack={graphsSoloHidden}
                      replayPositions={replay.positions}
                      replayTrails={replay.trails}
                      replayTelemetryBounds={replay.replayTelemetryBounds}
                    />
                  )}
                />
              ) : (
                <div className="flex-1 min-h-0 relative w-full">
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
                    replayPositions={isReplayLikeMode ? replay.positions : undefined}
                    replayTrails={isReplayLikeMode ? replay.trails : undefined}
                    replayTelemetryBounds={
                      isReplayLikeMode ? replay.replayTelemetryBounds : undefined
                    }
                  />
                </div>
              )}
              <button
                type="button"
                aria-expanded={driversPanelOpen}
                onClick={() => setDriversPanelOpen((o) => !o)}
                className="absolute z-[1000] rounded-full px-3.5 py-2 text-[13px] font-semibold shadow-lg transition-opacity active:opacity-80"
                style={{
                  top: 'max(12px, env(safe-area-inset-top))',
                  right: 'max(12px, env(safe-area-inset-right))',
                  background: 'rgba(28,28,30,0.72)',
                  WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                  backdropFilter: 'saturate(180%) blur(20px)',
                  border: '0.5px solid rgba(255,255,255,0.12)',
                  color: 'var(--ios-blue)',
                }}
              >
                {driversPanelOpen ? 'Hide' : 'Drivers'}
              </button>

              {isReplayLikeMode && (
                <button
                  type="button"
                  aria-expanded={replayBarVisible}
                  aria-controls="replay-controls-panel"
                  onClick={() => setReplayBarVisible((v) => !v)}
                  className="absolute z-[1000] rounded-full px-3.5 py-2 text-[13px] font-semibold shadow-lg transition-opacity active:opacity-80"
                  style={{
                    bottom: 'max(12px, env(safe-area-inset-bottom))',
                    left: 'max(12px, env(safe-area-inset-left))',
                    background: 'rgba(28,28,30,0.72)',
                    WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                    backdropFilter: 'saturate(180%) blur(20px)',
                    border: '0.5px solid rgba(255,255,255,0.12)',
                    color: 'var(--ios-blue)',
                  }}
                >
                  {replayBarVisible ? 'Hide controls' : 'Show controls'}
                </button>
              )}
            </div>

            {/* Right panel */}
            <div
              className={`flex min-h-0 shrink-0 flex-col overflow-hidden border-l transition-[width] duration-200 ease-out ${
                driversPanelOpen ? 'w-72' : 'w-0 border-transparent'
              }`}
              style={
                driversPanelOpen
                  ? {
                      background: 'var(--ios-grouped)',
                      borderColor: 'var(--ios-separator)',
                    }
                  : undefined
              }
            >
              <div className="flex h-full w-72 min-h-0 flex-col">
                {isMapMode ? (
                  <CircuitInfoPanel
                    meta={circuit.meta}
                    geo={circuit.geo}
                    session={session}
                    drivers={drivers}
                    selectedDriverNumber={selectedDriverNumber}
                    onSelectDriver={setSelectedDriverNumber}
                    driversHiddenOnTrack={driversHiddenOnTrackResolved}
                    allDriversVisibleOnTrack={allDriversVisibleOnTrack}
                    onToggleAllTrackVisibility={toggleAllTrackVisibility}
                    onToggleDriverTrackVisibility={toggleDriverTrackVisibility}
                  />
                ) : (
                  <DriverPanel
                    drivers={drivers}
                    selectedDriverNumber={selectedDriverNumber}
                    onSelectDriver={setSelectedDriverNumber}
                    selectedDriverLaps={selectedDriverLaps}
                    selectedDriverCarData={selectedDriverCarData}
                    replayCarData={replayCarData}
                    replayMode={isReplayLikeMode}
                    replayDriverData={replay.driverData}
                    replayCurrentTime={replay.currentTime}
                    replayTrails={isReplayLikeMode ? replay.trails : undefined}
                    trackOutline={trackOutline}
                    driversHiddenOnTrack={driversHiddenOnTrackResolved}
                    allDriversVisibleOnTrack={allDriversVisibleOnTrack}
                    onToggleAllTrackVisibility={toggleAllTrackVisibility}
                    onToggleDriverTrackVisibility={toggleDriverTrackVisibility}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Replay Controls */}
          {isReplayLikeMode && replayBarVisible && (
            <div id="replay-controls-panel">
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}
