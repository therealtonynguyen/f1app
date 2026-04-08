import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ChromaWhiteImage } from '@/components/ChromaWhiteImage';

const ASTON_BRAND_PATH = '/cars/aston-martin';
const FERRARI_BRAND_PATH = '/cars/ferrari';

const ASTON_AMR24_IMG =
  'https://cdn-2.motorsport.com/images/mgl/6zQeggPY/s1200/aston-martin-amr24.webp';

/** Same-origin so canvas can chroma-key the white studio (hotlinking blocks getImageData) */
const FERRARI_SF70H_IMG = '/ferrari-sf70h.jpg';

/** SVG filter — knock-out for Aston (Ferrari uses canvas chroma-key when CORS allows) */
const KNOCKOUT_FILTER_ID = 'cars-nav-bg-knockout';

const carMaxWidth = 'min(52vh, min(100vw - 2rem, 640px))';
const astonNudgeX = 'min(14vw, 7rem)';

export type CarsNavHoverPreviewVariant = 'light' | 'dark';

/**
 * Aston left; Ferrari right — Ferrari uses canvas white key (greenscreen-style) when the image is CORS-readable.
 * `dark` matches a black nav bar; `light` matches a white / non-black bar.
 */
export function CarsNavHoverPreview({ variant = 'light' }: { variant?: CarsNavHoverPreviewVariant }) {
  return (
    <>
      <svg className="pointer-events-none absolute h-0 w-0 overflow-hidden" aria-hidden>
        <defs>
          <filter
            id={KNOCKOUT_FILTER_ID}
            x="0"
            y="0"
            width="100%"
            height="100%"
            colorInterpolationFilters="sRGB"
          >
            <feColorMatrix
              type="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                -0.88 -0.88 -0.88 2.65 0
              "
            />
          </filter>
        </defs>
      </svg>
      <div
        className={cn(
          'flex h-full min-h-0 w-full flex-col items-stretch justify-center py-6 pr-4 sm:py-8 sm:pr-10',
          variant === 'light' ? 'bg-white' : 'bg-black'
        )}
      >
        <div className="relative h-full w-full min-h-0 flex-1 overflow-hidden">
          <div
            className={cn(
              'cars-nav-drive-strip absolute inset-0 flex w-full min-w-0 items-center justify-start gap-12 overflow-hidden pl-4 sm:gap-20 sm:pl-8 md:gap-28',
              variant === 'light' ? 'bg-white' : 'bg-black'
            )}
          >
            <Link
              to={ASTON_BRAND_PATH}
              className="relative z-[1] block shrink-0 cursor-pointer rounded-sm outline-none ring-offset-2 ring-offset-transparent transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-white/40"
              aria-label="Aston Martin — team page"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={ASTON_AMR24_IMG}
                alt=""
                className="pointer-events-none block h-auto w-auto max-w-none object-contain"
                style={{
                  maxWidth: carMaxWidth,
                  transform: `translateX(calc(-1 * ${astonNudgeX})) rotate(90deg)`,
                  filter: `url(#${KNOCKOUT_FILTER_ID})`,
                }}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            </Link>
            <Link
              to={FERRARI_BRAND_PATH}
              className={cn(
                'relative block h-[min(52vh,480px)] w-[min(34vw,280px)] shrink-0 cursor-pointer overflow-hidden sm:h-[min(56vh,520px)] sm:w-[min(38vw,320px)]',
                variant === 'light' ? 'bg-white' : 'bg-black'
              )}
              aria-label="Ferrari — team page"
              onClick={(e) => e.stopPropagation()}
            >
              <ChromaWhiteImage
                src={FERRARI_SF70H_IMG}
                alt=""
                className="absolute left-1/2 top-1/2 max-h-none min-h-[150%] min-w-[150%] max-w-none object-cover object-[center_40%]"
                style={{
                  transform: 'translate(-50%, -50%) rotate(270deg)',
                }}
                fallbackFilter={`url(#${KNOCKOUT_FILTER_ID})`}
              />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
