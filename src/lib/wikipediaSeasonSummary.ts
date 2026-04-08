/**
 * Wikipedia page summary for a Formula One season (lead image + short extract).
 */

const cache = new Map<number, FormulaOneSeasonSummary | null>();

export type FormulaOneSeasonSummary = {
  title: string;
  extract: string;
  thumbnailUrl: string | null;
};

function titleToPathSegment(title: string): string {
  return encodeURIComponent(title.trim().replace(/ /g, '_'));
}

const pageSummaryCache = new Map<string, WikipediaPageSummary | null>();

export type WikipediaPageSummary = {
  title: string;
  extract: string;
  thumbnailUrl: string | null;
};

/** Any Wikipedia article by exact title — used for chassis / team pages. */
export async function fetchWikipediaPageSummary(pageTitle: string): Promise<WikipediaPageSummary | null> {
  const key = pageTitle.trim();
  if (pageSummaryCache.has(key)) return pageSummaryCache.get(key)!;

  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${titleToPathSegment(key)}`;
    const res = await fetch(url);
    if (!res.ok) {
      pageSummaryCache.set(key, null);
      return null;
    }
    const data = (await res.json()) as {
      title?: string;
      extract?: string;
      thumbnail?: { source: string };
      type?: string;
    };
    if (data.type !== 'standard' || !data.extract) {
      pageSummaryCache.set(key, null);
      return null;
    }
    const summary: WikipediaPageSummary = {
      title: data.title ?? key,
      extract: data.extract,
      thumbnailUrl: data.thumbnail?.source ?? null,
    };
    pageSummaryCache.set(key, summary);
    return summary;
  } catch {
    pageSummaryCache.set(key, null);
    return null;
  }
}

export async function fetchFormulaOneSeasonSummary(year: number): Promise<FormulaOneSeasonSummary | null> {
  if (cache.has(year)) return cache.get(year)!;

  const titles = [`${year} Formula One World Championship`, `${year} Formula One season`];

  for (const title of titles) {
    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${titleToPathSegment(title)}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = (await res.json()) as {
        title?: string;
        extract?: string;
        thumbnail?: { source: string };
        type?: string;
      };
      if (data.type !== 'standard' || !data.extract) continue;

      const summary: FormulaOneSeasonSummary = {
        title: data.title ?? title,
        extract: data.extract,
        thumbnailUrl: data.thumbnail?.source ?? null,
      };
      cache.set(year, summary);
      return summary;
    } catch {
      continue;
    }
  }

  cache.set(year, null);
  return null;
}

/** Short static note on car regulations / look for that era (complements Wikipedia). */
export function formulaOneGenerationNote(year: number): string {
  if (year >= 2026) return 'Current technical regulations; iterative aero and power-unit evolution.';
  if (year >= 2022)
    return 'Ground-effect floors, 18″ low-profile tyres, and a major aero reset—washing less dirty air.';
  if (year >= 2017) return 'Wide cars and tyres; hybrid V6 turbo era with high-downforce packages.';
  if (year >= 2014) return '1.6L V6 turbo-hybrid power units replace the screaming V8s.';
  if (year >= 2009)
    return 'Slick tyres return; tall narrow rear wings then evolving aero—still 2.4L V8s through 2013.';
  if (year >= 2006) return '2.4L V8 era begins—replacing 3.0L V10s—distinct narrow-body cars vs later hybrids.';
  return 'Classic Formula One machinery.';
}
