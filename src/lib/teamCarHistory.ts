/**
 * Wikipedia article titles per team / year for the team car-history page.
 * Images load at runtime via fetchWikipediaPageSummary (lead photo per chassis).
 */

export type ChassisEntry = {
  year: number;
  wikipediaTitle: string;
};

export type TeamSlug =
  | 'red-bull-racing'
  | 'mercedes'
  | 'ferrari'
  | 'mclaren'
  | 'williams'
  | 'aston-martin'
  | 'alpine'
  | 'haas'
  | 'rb'
  | 'racing-bulls'
  | 'kick-sauber'
  | 'audi'
  | 'sauber'
  | 'renault'
  | 'force-india'
  | 'toro-rosso'
  | 'lotus'
  | 'cadillac';

const RB_MODEL: Record<number, string> = {
  2006: 'RB2',
  2007: 'RB3',
  2008: 'RB4',
  2009: 'RB5',
  2010: 'RB6',
  2011: 'RB7',
  2012: 'RB8',
  2013: 'RB9',
  2014: 'RB10',
  2015: 'RB11',
  2016: 'RB12',
  2017: 'RB13',
  2018: 'RB14',
  2019: 'RB15',
  2020: 'RB16',
  2021: 'RB16B',
  2022: 'RB18',
  2023: 'RB19',
  2024: 'RB20',
  2025: 'RB21',
  2026: 'RB22',
};

function buildRedBull(): ChassisEntry[] {
  return Object.entries(RB_MODEL).map(([y, m]) => ({
    year: Number(y),
    wikipediaTitle: `Red Bull Racing ${m}`,
  }));
}

const MERCEDES_TITLES: Record<number, string> = {
  2010: 'Mercedes MGP W01',
  2011: 'Mercedes MGP W02',
  2012: 'Mercedes F1 W03',
  2013: 'Mercedes F1 W04',
  2014: 'Mercedes F1 W05 Hybrid',
  2015: 'Mercedes F1 W06 Hybrid',
  2016: 'Mercedes F1 W07 Hybrid',
  2017: 'Mercedes F1 W08 EQ Power+',
  2018: 'Mercedes F1 W09 EQ Power+',
  2019: 'Mercedes F1 W10 EQ Power+',
  2020: 'Mercedes-AMG F1 W11 EQ Performance',
  2021: 'Mercedes W12',
  2022: 'Mercedes W13',
  2023: 'Mercedes W14',
  2024: 'Mercedes W15',
  2025: 'Mercedes W16',
  2026: 'Mercedes W17',
};

function buildMercedes(): ChassisEntry[] {
  return Object.entries(MERCEDES_TITLES).map(([y, t]) => ({
    year: Number(y),
    wikipediaTitle: t,
  }));
}

const FERRARI_TITLES: Record<number, string> = {
  2006: 'Ferrari 248 F1',
  2007: 'Ferrari F2007',
  2008: 'Ferrari F2008',
  2009: 'Ferrari F60',
  2010: 'Ferrari F10',
  2011: 'Ferrari 150° Italia',
  2012: 'Ferrari F2012',
  2013: 'Ferrari F138',
  2014: 'Ferrari F14 T',
  2015: 'Ferrari SF15-T',
  2016: 'Ferrari SF16-H',
  2017: 'Ferrari SF70H',
  2018: 'Ferrari SF71H',
  2019: 'Ferrari SF90',
  2020: 'Ferrari SF1000',
  2021: 'Ferrari SF21',
  2022: 'Ferrari F1-75',
  2023: 'Ferrari SF-23',
  2024: 'Ferrari SF-24',
  2025: 'Ferrari SF-25',
  2026: 'Ferrari SF-26',
};

function buildFerrari(): ChassisEntry[] {
  return Object.entries(FERRARI_TITLES).map(([y, t]) => ({
    year: Number(y),
    wikipediaTitle: t,
  }));
}

const MCLAREN_TITLES: Record<number, string> = {
  2006: 'McLaren MP4-21',
  2007: 'McLaren MP4-22',
  2008: 'McLaren MP4-23',
  2009: 'McLaren MP4-24',
  2010: 'McLaren MP4-25',
  2011: 'McLaren MP4-26',
  2012: 'McLaren MP4-27',
  2013: 'McLaren MP4-28',
  2014: 'McLaren MP4-29',
  2015: 'McLaren MP4-30',
  2016: 'McLaren MP4-31',
  2017: 'McLaren MCL32',
  2018: 'McLaren MCL33',
  2019: 'McLaren MCL34',
  2020: 'McLaren MCL35',
  2021: 'McLaren MCL35M',
  2022: 'McLaren MCL36',
  2023: 'McLaren MCL60',
  2024: 'McLaren MCL38',
  2025: 'McLaren MCL39',
  2026: 'McLaren MCL40',
};

function buildMcLaren(): ChassisEntry[] {
  return Object.entries(MCLAREN_TITLES).map(([y, t]) => ({
    year: Number(y),
    wikipediaTitle: t,
  }));
}

const WILLIAMS_TITLES: Record<number, string> = {
  2006: 'Williams FW28',
  2007: 'Williams FW29',
  2008: 'Williams FW30',
  2009: 'Williams FW31',
  2010: 'Williams FW32',
  2011: 'Williams FW33',
  2012: 'Williams FW34',
  2013: 'Williams FW35',
  2014: 'Williams FW36',
  2015: 'Williams FW37',
  2016: 'Williams FW38',
  2017: 'Williams FW40',
  2018: 'Williams FW41',
  2019: 'Williams FW42',
  2020: 'Williams FW43',
  2021: 'Williams FW43B',
  2022: 'Williams FW44',
  2023: 'Williams FW45',
  2024: 'Williams FW46',
  2025: 'Williams FW47',
  2026: 'Williams FW48',
};

function buildWilliams(): ChassisEntry[] {
  return Object.entries(WILLIAMS_TITLES).map(([y, t]) => ({
    year: Number(y),
    wikipediaTitle: t,
  }));
}

/** Enstone factory: Renault → Lotus → Renault → Alpine */
const ALPINE_TITLES: Record<number, string> = {
  2006: 'Renault R26',
  2007: 'Renault R27',
  2008: 'Renault R28',
  2009: 'Renault R29',
  2010: 'Renault R30',
  2011: 'Renault R31',
  2012: 'Lotus E20',
  2013: 'Lotus E21',
  2014: 'Lotus E22',
  2015: 'Lotus E23 Hybrid',
  2016: 'Renault R.S.16',
  2017: 'Renault R.S.17',
  2018: 'Renault R.S.18',
  2019: 'Renault R.S.19',
  2020: 'Renault R.S.20',
  2021: 'Alpine A521',
  2022: 'Alpine A522',
  2023: 'Alpine A523',
  2024: 'Alpine A524',
  2025: 'Alpine A525',
  2026: 'Alpine A526',
};

function buildAlpine(): ChassisEntry[] {
  return Object.entries(ALPINE_TITLES).map(([y, t]) => ({
    year: Number(y),
    wikipediaTitle: t,
  }));
}

function buildHaas(): ChassisEntry[] {
  const out: ChassisEntry[] = [];
  for (let y = 2016; y <= 2026; y++) {
    out.push({ year: y, wikipediaTitle: `Haas VF-${y - 2000}` });
  }
  return out;
}

function buildRacingBulls(): ChassisEntry[] {
  const out: ChassisEntry[] = [];
  for (let n = 1; n <= 14; n++) {
    out.push({ year: 2005 + n, wikipediaTitle: `Toro Rosso STR${n}` });
  }
  const tail: [number, string][] = [
    [2020, 'AlphaTauri AT01'],
    [2021, 'AlphaTauri AT02'],
    [2022, 'AlphaTauri AT03'],
    [2023, 'AlphaTauri AT04'],
    [2024, 'RB VCARB 01'],
    [2025, 'Racing Bulls VCARB 02'],
    [2026, 'Racing Bulls VCARB 03'],
  ];
  out.push(...tail.map(([year, wikipediaTitle]) => ({ year, wikipediaTitle })));
  return out.sort((a, b) => a.year - b.year);
}

const SAUBER_TITLES: Record<number, string> = {
  2006: 'BMW Sauber F1.06',
  2007: 'BMW Sauber F1.07',
  2008: 'BMW Sauber F1.08',
  2009: 'BMW Sauber F1.09',
  2010: 'Sauber C29',
  2011: 'Sauber C30',
  2012: 'Sauber C31',
  2013: 'Sauber C32',
  2014: 'Sauber C33',
  2015: 'Sauber C34',
  2016: 'Sauber C35',
  2017: 'Sauber C36',
  2018: 'Sauber C37',
  2019: 'Alfa Romeo C38',
  2020: 'Alfa Romeo C39',
  2021: 'Alfa Romeo C41',
  2022: 'Alfa Romeo C42',
  2023: 'Alfa Romeo C43',
  2024: 'Kick Sauber C44',
  2025: 'Kick Sauber C45',
  2026: 'Kick Sauber C45',
};

function buildSauber(): ChassisEntry[] {
  return Object.entries(SAUBER_TITLES).map(([y, t]) => ({
    year: Number(y),
    wikipediaTitle: t,
  }));
}

const ASTON_TITLES: Record<number, string> = {
  2008: 'Force India VJM01',
  2009: 'Force India VJM02',
  2010: 'Force India VJM03',
  2011: 'Force India VJM04',
  2012: 'Force India VJM05',
  2013: 'Force India VJM06',
  2014: 'Force India VJM07',
  2015: 'Force India VJM08',
  2016: 'Force India VJM09',
  2017: 'Force India VJM10',
  2018: 'Force India VJM11',
  2019: 'Racing Point RP19',
  2020: 'Racing Point RP20',
  2021: 'Aston Martin AMR21',
  2022: 'Aston Martin AMR22',
  2023: 'Aston Martin AMR23',
  2024: 'Aston Martin AMR24',
  2025: 'Aston Martin AMR25',
  2026: 'Aston Martin AMR26',
};

function buildAstonMartin(): ChassisEntry[] {
  return Object.entries(ASTON_TITLES).map(([y, t]) => ({
    year: Number(y),
    wikipediaTitle: t,
  }));
}

function buildForceIndia(): ChassisEntry[] {
  const out: ChassisEntry[] = [];
  for (let i = 1; i <= 11; i++) {
    const year = 2007 + i;
    const pad = i < 10 ? `0${i}` : `${i}`;
    out.push({ year, wikipediaTitle: `Force India VJM${pad}` });
  }
  return out;
}

const LOTUS_TITLES: Record<number, string> = {
  2010: 'Lotus T127',
  2011: 'Lotus T128',
  2012: 'Lotus E20',
  2013: 'Lotus E21',
  2014: 'Lotus E22',
  2015: 'Lotus E23 Hybrid',
};

function buildLotus(): ChassisEntry[] {
  return Object.entries(LOTUS_TITLES).map(([y, t]) => ({
    year: Number(y),
    wikipediaTitle: t,
  }));
}

const RENAULT_STANDALONE: Record<number, string> = {
  2006: 'Renault R26',
  2007: 'Renault R27',
  2008: 'Renault R28',
  2009: 'Renault R29',
  2010: 'Renault R30',
  2011: 'Renault R31',
};

function buildRenaultWorks(): ChassisEntry[] {
  return Object.entries(RENAULT_STANDALONE).map(([y, t]) => ({
    year: Number(y),
    wikipediaTitle: t,
  }));
}

/** Cadillac works entry from 2026 — overview until per-year chassis pages exist */
function buildCadillac(): ChassisEntry[] {
  return [{ year: 2026, wikipediaTitle: 'Cadillac in Formula One' }];
}

const PRIMARY: Record<TeamSlug, () => ChassisEntry[]> = {
  'red-bull-racing': buildRedBull,
  mercedes: buildMercedes,
  ferrari: buildFerrari,
  mclaren: buildMcLaren,
  williams: buildWilliams,
  'aston-martin': buildAstonMartin,
  alpine: buildAlpine,
  haas: buildHaas,
  rb: buildRacingBulls,
  'racing-bulls': buildRacingBulls,
  'kick-sauber': buildSauber,
  audi: buildSauber,
  sauber: buildSauber,
  renault: buildRenaultWorks,
  'force-india': buildForceIndia,
  'toro-rosso': buildRacingBulls,
  lotus: buildLotus,
  cadillac: buildCadillac,
};

/** Display name for the history page hero */
export const TEAM_DISPLAY_NAME: Record<TeamSlug, string> = {
  'red-bull-racing': 'Red Bull Racing',
  mercedes: 'Mercedes',
  ferrari: 'Ferrari',
  mclaren: 'McLaren',
  williams: 'Williams',
  'aston-martin': 'Aston Martin',
  alpine: 'Alpine',
  haas: 'Haas',
  rb: 'RB',
  'racing-bulls': 'Racing Bulls',
  'kick-sauber': 'Kick Sauber',
  audi: 'Audi',
  sauber: 'Sauber',
  renault: 'Renault',
  'force-india': 'Force India',
  'toro-rosso': 'Toro Rosso',
  lotus: 'Lotus',
  cadillac: 'Cadillac',
};

/** Simple Icons (CC0) — pinned for stable SVG URLs */
const SI_V11 = 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons';

/** App-owned symbol marks in /public/team-symbols/ (no lettering) */
const sym = (file: string) => `/team-symbols/${file}`;

/**
 * Symbol-only marks for the car-history watermark (no team names as type).
 * Mix: Simple Icons, Wikimedia Commons, and local SVGs where no clean symbol exists on Commons.
 */
export const TEAM_LOGO_URL: Record<TeamSlug, string> = {
  'red-bull-racing': `${SI_V11}/redbull.svg`,
  mercedes: `${SI_V11}/mercedes.svg`,
  ferrari:
    'https://static.wixstatic.com/media/f2bf43_655a783d22fd4786aa17b096ba3ff9e5~mv2.png',
  mclaren: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/McLaren_Speedmark.svg',
  williams: sym('williams.svg'),
  'aston-martin':
    'https://brandlogos.net/wp-content/uploads/2022/10/aston_martin_f1-logo_brandlogos.net_5zklm.png',
  alpine:
    'https://e7.pngegg.com/pngimages/253/337/png-clipart-alpine-car-logo-renault-symbol-car-blue-angle.png',
  haas: sym('haas.svg'),
  rb: sym('toro-bull.svg'),
  'racing-bulls': sym('toro-bull.svg'),
  'kick-sauber': sym('sauber.svg'),
  audi: `${SI_V11}/audi.svg`,
  sauber: sym('sauber.svg'),
  renault: `${SI_V11}/renault.svg`,
  'force-india': sym('force-india.svg'),
  'toro-rosso': sym('toro-bull.svg'),
  lotus: sym('lotus.svg'),
  cadillac: `${SI_V11}/cadillac.svg`,
};

const NAME_TO_SLUG: Record<string, TeamSlug> = {
  'Red Bull Racing': 'red-bull-racing',
  Mercedes: 'mercedes',
  Ferrari: 'ferrari',
  McLaren: 'mclaren',
  Williams: 'williams',
  'Aston Martin': 'aston-martin',
  Alpine: 'alpine',
  Haas: 'haas',
  RB: 'rb',
  'Racing Bulls': 'racing-bulls',
  'Kick Sauber': 'kick-sauber',
  Audi: 'audi',
  Sauber: 'sauber',
  Renault: 'renault',
  'Force India': 'force-india',
  'Toro Rosso': 'toro-rosso',
  'Racing Point': 'aston-martin',
  Lotus: 'lotus',
  Cadillac: 'cadillac',
  AlphaTauri: 'rb',
  'Alfa Romeo': 'kick-sauber',
};

export function teamNameToSlug(name: string): TeamSlug | null {
  return NAME_TO_SLUG[name] ?? null;
}

export function parseTeamSlugParam(param: string | undefined): TeamSlug | null {
  if (!param) return null;
  const normalized = param.toLowerCase().trim();
  const valid = Object.keys(PRIMARY) as TeamSlug[];
  if (valid.includes(normalized as TeamSlug)) return normalized as TeamSlug;
  return null;
}

/** Chassis list, years descending (newest first) */
export function getChassisHistoryDescending(slug: TeamSlug): ChassisEntry[] {
  const fn = PRIMARY[slug];
  if (!fn) return [];
  return [...fn()].sort((a, b) => b.year - a.year);
}
