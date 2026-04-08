import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useF1Data } from './hooks/useF1Data';
import { useLapReplay } from './hooks/useLapReplay';
import { useReplayCarTelemetry } from './hooks/useReplayCarTelemetry';
import { useCircuitData } from './hooks/useCircuitData';
import { useTheme } from './hooks/useTheme';
import { Header } from './components/Header';
import { DriverPanel } from './components/DriverPanel';
import { RaceResultsPanel } from './components/RaceResultsPanel';
import { ReplayControls } from './components/ReplayControls';
import { MapView } from './components/MapView';
import { CircuitMap } from './components/CircuitMap';
import { CircuitInfoPanel } from './components/CircuitInfoPanel';
import { DriverTelemetryGraphs } from './components/DriverTelemetryGraphs';
import { SessionPicker } from './components/SessionPicker';
import { isErgastSessionKey } from './lib/ergastKeys';
import { useAllDriversReplayCarSeries } from './hooks/useAllDriversReplayCarSeries';
import type { AppMode } from './types/appMode';

export type { AppMode };

type MapLayer = 'satellite' | 'circuit';

export function F1DataApp() {
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState<AppMode>('live');
  const [mapLayer, setMapLayer] = useState<MapLayer>('satellite');
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
  const isResultsMode = mode === 'results';

  // A finished Race session (not a Sprint) — swap Live → Results
  const isFinishedRace = useMemo(() => {
    if (!session) return false;
    const type = session.session_type?.toLowerCase() ?? '';
    const name = session.session_name?.toLowerCase() ?? '';
    if (type !== 'race' || name.includes('sprint')) return false;
    if (session.status === 'finished') return true;
    // Fall back to date check for old sessions without status
    const end = session.date_end ? new Date(session.date_end).getTime() : null;
    return end != null && end < Date.now();
  }, [session]);

  // Auto-switch to Results when opening a finished race (user can still pick Live)
  useEffect(() => {
    if (!session) return;
    if (isFinishedRace && mode === 'live') setMode('results');
  }, [isFinishedRace, session?.session_key]); // eslint-disable-line react-hooks/exhaustive-deps

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
      className="flex h-full min-h-0 flex-col overflow-hidden"
      style={{ background: 'var(--ios-bg)' }}
    >
      <Header
        session={session}
        isLive={isLive}
        isFinishedRace={isFinishedRace}
        isLoading={isLoading}
        isLoadingTrack={circuit.isLoading}
        onRefresh={refresh}
        onOpenSessionPicker={() => setSessionPickerOpen(true)}
        mode={mode}
        onModeChange={session ? handleModeChange : undefined}
        theme={theme}
        onToggleTheme={toggleTheme}
        embeddedInShell
      />

      <SessionPicker
        open={sessionPickerOpen}
        onOpenChange={setSessionPickerOpen}
        currentSessionKey={session?.session_key}
        onSelect={(sessionKey) => {
          replay.pause();
          setMode('live');
          loadSession(sessionKey);
        }}
      />

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
          {session && isErgastSessionKey(session.session_key) && (
            <div
              className="shrink-0 px-4 py-2.5 text-center text-[12px] leading-snug sm:text-[13px]"
              style={{
                background: 'rgba(225, 6, 0, 0.12)',
                borderBottom: '0.5px solid rgba(225, 6, 0, 0.35)',
                color: 'var(--ios-label-secondary)',
              }}
            >
              <span className="font-semibold text-[#ff6b5c]">Pre-2023 weekend</span>
              {' — '}
              Schedule and session times come from the historical F1 calendar. Timing, map, and replay
              telemetry in this app use OpenF1 (2023 season onward).
            </div>
          )}
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
                  {mapLayer === 'satellite' ? (
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
                  ) : (
                    <CircuitMap
                      trackOutline={trackOutline}
                      drivers={drivers}
                      selectedDriverNumber={selectedDriverNumber}
                      onSelectDriver={setSelectedDriverNumber}
                      driversHiddenOnTrack={driversHiddenOnTrackResolved}
                      replayPositions={isReplayLikeMode ? replay.positions : undefined}
                      replayTrails={isReplayLikeMode ? replay.trails : undefined}
                    />
                  )}

                  {/* Layer toggle — bottom-centre */}
                  <div
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center rounded-2xl gap-1 shadow-lg"
                    style={{
                      padding: '5px 6px',
                      background: 'rgba(28,28,30,0.82)',
                      WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                      backdropFilter: 'saturate(180%) blur(20px)',
                      border: '0.5px solid rgba(255,255,255,0.14)',
                    }}
                  >
                    {(['satellite', 'circuit'] as MapLayer[]).map((layer) => (
                      <button
                        key={layer}
                        type="button"
                        onClick={() => setMapLayer(layer)}
                        className="rounded-xl text-[12px] font-semibold transition-all duration-200 whitespace-nowrap"
                        style={{
                          padding: '7px 16px',
                          ...(mapLayer === layer
                            ? { background: 'rgba(255,255,255,0.16)', color: '#fff' }
                            : { background: 'transparent', color: 'rgba(255,255,255,0.4)' }),
                        }}
                      >
                        {layer === 'satellite' ? '🛰  Satellite' : '🏎  Circuit'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Panel toggle — permanent 24 px strip between map and right panel */}
            <button
              type="button"
              aria-expanded={driversPanelOpen}
              aria-label={driversPanelOpen ? 'Collapse panel' : 'Expand panel'}
              onClick={() => setDriversPanelOpen((o) => !o)}
              className="shrink-0 flex items-center justify-center transition-colors hover:brightness-110 active:brightness-90"
              style={{
                width: 24,
                background: 'var(--ios-grouped)',
                borderLeft: '0.5px solid var(--ios-separator)',
                borderRight: '0.5px solid var(--ios-separator)',
              }}
            >
              {driversPanelOpen
                ? <ChevronRight className="h-4 w-4" style={{ color: 'var(--ios-label-secondary)' }} />
                : <ChevronLeft className="h-4 w-4" style={{ color: 'var(--ios-label-secondary)' }} />}
            </button>

            {/* Right panel */}
            <div
              className={`flex min-h-0 shrink-0 flex-col overflow-hidden transition-[width] duration-200 ease-out`}
              style={{
                width: driversPanelOpen ? 272 : 0,
                background: 'var(--ios-grouped)',
              }}
            >
              <div className="flex h-full min-h-0 flex-col" style={{ width: 272 }}>
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
                ) : isResultsMode ? (
                  <RaceResultsPanel
                    drivers={drivers}
                    session_name={session?.session_name ?? 'Race'}
                    selectedDriverNumber={selectedDriverNumber}
                    onSelectDriver={setSelectedDriverNumber}
                    isLive={isLive && !isFinishedRace}
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

          {/* Replay Controls — collapsible via tab handle */}
          {isReplayLikeMode && (
            <div>
              {/* Collapse/expand handle */}
              <button
                type="button"
                aria-expanded={replayBarVisible}
                aria-controls="replay-controls-panel"
                onClick={() => setReplayBarVisible((v) => !v)}
                className="w-full flex items-center justify-center gap-2 transition-colors hover:brightness-110"
                style={{
                  height: 28,
                  background: 'var(--ios-grouped)',
                  borderTop: `0.5px solid var(--ios-separator)`,
                }}
              >
                <span
                  className="text-[11px] font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--ios-label-secondary)' }}
                >
                  Replay Controls
                </span>
                {replayBarVisible
                  ? <ChevronDown className="h-3.5 w-3.5" style={{ color: 'var(--ios-label-secondary)' }} />
                  : <ChevronUp className="h-3.5 w-3.5" style={{ color: 'var(--ios-label-secondary)' }} />}
              </button>

              {replayBarVisible && (
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
      )}
    </div>
  );
}
