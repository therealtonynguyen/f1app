interface Props {
  visible: boolean;
  onToggle: () => void;
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
