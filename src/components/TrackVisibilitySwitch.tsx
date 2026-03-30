interface Props {
  visible: boolean;
  onToggle: () => void;
}

interface ToggleAllProps {
  allVisible: boolean;
  onToggle: () => void;
}

/** Compact toggle — 28 × 16 px */
function MiniToggle({
  checked,
  onToggle,
  ariaLabel,
  title,
}: {
  checked: boolean;
  onToggle: () => void;
  ariaLabel: string;
  title: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className="relative shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ios-blue)]/35"
      style={{
        width: 28,
        height: 16,
        background: checked ? 'var(--ios-green)' : 'var(--ios-grouped-tertiary)',
      }}
    >
      <span
        className="pointer-events-none absolute rounded-full bg-white shadow-sm transition-transform duration-200 ease-out"
        style={{
          width: 12,
          height: 12,
          top: 2,
          left: 2,
          transform: checked ? 'translateX(12px)' : 'translateX(0)',
        }}
      />
    </button>
  );
}

/** Master switch — show/hide all drivers on track. */
export function ToggleAllTrackVisibility({ allVisible, onToggle }: ToggleAllProps) {
  return (
    <MiniToggle
      checked={allVisible}
      onToggle={onToggle}
      ariaLabel={allVisible ? 'All drivers visible on track' : 'Some drivers hidden'}
      title={allVisible ? 'Hide all drivers from track' : 'Show all drivers on track'}
    />
  );
}

/** Per-driver toggle — visible on track vs hidden. */
export function TrackVisibilitySwitch({ visible, onToggle }: Props) {
  return (
    <MiniToggle
      checked={visible}
      onToggle={onToggle}
      ariaLabel={visible ? 'Visible on track' : 'Hidden on track'}
      title={visible ? 'Hide on track' : 'Show on track'}
    />
  );
}
