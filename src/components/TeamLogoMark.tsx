import { teamLogoUrl } from '../lib/teamLogos';

interface Props {
  teamName: string;
  className?: string;
}

/** Small constructor logo next to driver name; hides on load error. */
export function TeamLogoMark({ teamName, className = '' }: Props) {
  const src = teamLogoUrl(teamName);
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      className={`h-5 w-5 shrink-0 object-contain ${className}`}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}
