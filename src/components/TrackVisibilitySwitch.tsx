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
    <div className="flex items-center gap-1.5 shrink-0">
      <span className="text-[8px] font-bold uppercase tracking-wider text-gray-500">All</span>
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
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 ${
          allVisible ? 'bg-emerald-600/90' : 'bg-[#2a2a3c]'
        }`}
      >
        <span
          className={`pointer-events-none absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${
            allVisible ? 'translate-x-4' : 'translate-x-0'
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
      className={`relative shrink-0 w-9 h-5 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 ${
        visible ? 'bg-emerald-600/90' : 'bg-[#2a2a3c]'
      }`}
    >
      <span
        className={`pointer-events-none absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${
          visible ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
