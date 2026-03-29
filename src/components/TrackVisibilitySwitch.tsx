interface Props {
  visible: boolean;
  onToggle: () => void;
}

interface ToggleAllProps {
  /** True when every driver in the session is shown on the track. */
  allVisible: boolean;
  onToggle: () => void;
}

/** Master switch: show every driver on the map vs hide everyone. */
export function ToggleAllTrackVisibility({ allVisible, onToggle }: ToggleAllProps) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <span
        className="text-[8px] font-bold uppercase tracking-wider"
        style={{ color: 'var(--ios-label-tertiary)' }}
      >
        All
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={allVisible}
        aria-label={allVisible ? 'All drivers visible on track' : 'Some or no drivers visible on track'}
        title={allVisible ? 'Hide all drivers from track' : 'Show all drivers on track'}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ios-blue)]/35"
        style={{
          background: allVisible ? 'var(--ios-green)' : 'var(--ios-grouped-tertiary)',
        }}
      >
        <span
          className={`pointer-events-none absolute top-[2px] left-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-md transition-transform duration-200 ease-out ${
            allVisible ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

/** On/off pill switch: visible on track vs hidden. */
export function TrackVisibilitySwitch({ visible, onToggle }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={visible}
      aria-label={visible ? 'Visible on track' : 'Hidden on track'}
      title={visible ? 'Hide on track' : 'Show on track'}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className="relative shrink-0 w-[51px] h-[31px] rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ios-blue)]/35"
      style={{ background: visible ? 'var(--ios-green)' : 'var(--ios-grouped-tertiary)' }}
    >
      <span
        className={`pointer-events-none absolute top-[2px] left-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-md transition-transform duration-200 ease-out ${
          visible ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
