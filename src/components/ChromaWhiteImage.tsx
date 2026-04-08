import { useEffect, useState, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';

/** Key out near-white studio background (greenscreen-style): high luminance + low chroma → transparent. */
function keyWhiteFromImageData(data: Uint8ClampedArray) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const chroma = max - min;
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    let a = 255;
    if (luminance > 250 && chroma < 14) {
      a = 0;
    } else if (luminance > 195 && chroma < 32) {
      const lumKey = Math.min(1, (luminance - 195) / 60);
      const satKey = 1 - Math.min(1, chroma / 32);
      const key = lumKey * 0.65 + satKey * 0.35;
      a = Math.round(255 * (1 - Math.min(1, key)));
    }
    data[i + 3] = a;
  }
}

const MAX_PROCESS_EDGE = 1600;

type ChromaWhiteImageProps = {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  /** Shown when canvas fails (CORS) or while processing */
  fallbackFilter?: string;
};

/**
 * Renders `src` with near-white pixels made transparent (greenscreen-style).
 * Requires CORS-enabled image; otherwise falls back to a normal `<img>` with `fallbackFilter`.
 */
export function ChromaWhiteImage({ src, alt, className, style, fallbackFilter }: ChromaWhiteImageProps) {
  const [pngUrl, setPngUrl] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setPngUrl(null);
    setUseFallback(false);

    const img = new Image();
    try {
      const resolved = new URL(src, window.location.href);
      if (resolved.origin !== window.location.origin) {
        img.crossOrigin = 'anonymous';
      }
    } catch {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      if (cancelled) return;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w < 1 || h < 1) {
        setUseFallback(true);
        return;
      }
      let scale = 1;
      if (Math.max(w, h) > MAX_PROCESS_EDGE) {
        scale = MAX_PROCESS_EDGE / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        setUseFallback(true);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      let imageData: ImageData;
      try {
        imageData = ctx.getImageData(0, 0, w, h);
      } catch {
        setUseFallback(true);
        return;
      }
      keyWhiteFromImageData(imageData.data);
      ctx.putImageData(imageData, 0, 0);
      let url: string;
      try {
        url = canvas.toDataURL('image/png');
      } catch {
        setUseFallback(true);
        return;
      }
      if (!cancelled) setPngUrl(url);
    };
    img.onerror = () => {
      if (!cancelled) setUseFallback(true);
    };
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  if (useFallback) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={fallbackFilter ? { ...style, filter: fallbackFilter } : style}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
      />
    );
  }

  if (!pngUrl) {
    return (
      <div
        className={cn('animate-pulse bg-neutral-300/30', className)}
        style={style}
        aria-hidden
      />
    );
  }

  return (
    <img
      src={pngUrl}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
      decoding="async"
    />
  );
}
