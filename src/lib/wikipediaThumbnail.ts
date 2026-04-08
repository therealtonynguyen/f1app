/**
 * Fetches a lead image from Wikipedia’s page summary API (CORS-enabled for browsers).
 * Tries several article titles in order until one resolves.
 */
const cache = new Map<string, string | null>();

function titleToPathSegment(title: string): string {
  return encodeURIComponent(title.trim().replace(/ /g, '_'));
}

export function wikipediaTitleCandidates(meeting: {
  location: string;
  meeting_name: string;
  meeting_official_name: string;
  circuit_short_name: string;
}): string[] {
  const official = meeting.meeting_official_name.replace(/\s*\([^)]*\)\s*$/, '').trim();
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (t: string) => {
    const s = t.trim();
    if (s.length < 2 || seen.has(s)) return;
    seen.add(s);
    out.push(s);
  };
  add(`${meeting.location} Grand Prix`);
  add(official);
  add(meeting.meeting_name);
  add(`${meeting.circuit_short_name} Circuit`);
  add(meeting.circuit_short_name);
  add(`${meeting.location} circuit`);
  return out;
}

export async function fetchWikipediaThumbnailForMeeting(meeting: {
  meeting_key: number;
  location: string;
  meeting_name: string;
  meeting_official_name: string;
  circuit_short_name: string;
}): Promise<string | null> {
  const cacheKey = `m:${meeting.meeting_key}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const titles = wikipediaTitleCandidates(meeting);
  for (const title of titles) {
    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${titleToPathSegment(title)}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = (await res.json()) as {
        thumbnail?: { source: string };
        type?: string;
      };
      if (data.type === 'standard' && data.thumbnail?.source) {
        cache.set(cacheKey, data.thumbnail.source);
        return data.thumbnail.source;
      }
    } catch {
      continue;
    }
  }
  cache.set(cacheKey, null);
  return null;
}
