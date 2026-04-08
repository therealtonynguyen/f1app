/**
 * Full-bleed team rows for the Generations page.
 * Car photos are Wikipedia Commons originals (lead images from each chassis article).
 */

import type { TeamSlug } from '@/lib/teamCarHistory';
import { teamNameToSlug } from '@/lib/teamCarHistory';

export type GenerationTeamRow = {
  name: string;
  tagline: string;
  /** Direct upload.wikimedia.org URL — actual race-car photography */
  image: string;
  teamSlug: TeamSlug;
};

/** 2024 grid — order matches TEAMS_MODERN (launch / official team imagery) */
const IMAGES_2024: readonly string[] = [
  'https://us.f1authentics.com/cdn/shop/files/FRONTSI202402150763copy.jpg?v=1763988651&width=2000',
  'https://media.formula1.com/image/upload/t_16by9Centre/c_lfill,w_3392/q_auto/v1740000001/fom-website/2023/Mercedes/W15%20launch/Mercedes-AMG%20W15%20E%20PERFORMANCE%20-%20Lewis%20Hamilton%20-%20Front%20Quarter.webp',
  'https://media.formula1.com/image/upload/t_16by9Centre/c_lfill,w_3392/q_auto/v1740000001/fom-website/2023/Miscellaneous/ferrari-sf-24-5.webp',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/fom-website/2023/McLaren/Formula%201%20header%20template%20(35).webp',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/fom-website/2023/Aston%20Martin/AMR24%20launch/AMR24_16x9_Image_4%20(3).webp',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/fom-website/2023/Miscellaneous/alpine-2024-car-launch-10-PINK.webp',
  'https://media.formula1.com/image/upload/t_16by9Centre/c_lfill,w_3392/q_auto/v1740000001/fom-website/2023/Haas/VF24-BOTH.webp',
  'https://media.formula1.com/image/upload/t_16by9Centre/c_lfill,w_3392/q_auto/v1740000001/fom-website/2023/RB%20(Visa%20Cashapp)/RB%20Launch/RB%20Launch%201.webp',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/fom-website/2023/Miscellaneous/williams-2024-livery.webp',
  'https://media.formula1.com/image/upload/t_16by9Centre/c_lfill,w_3392/q_auto/v1740000001/fom-website/2023/Kick%20Sauber/C44_ST-Front-left_Stake_ZHO_16-9.webp',
];

/** 2019 grid — order matches IMAGES_2019 */
const TEAMS_2019 = [
  'Red Bull Racing',
  'Mercedes',
  'Ferrari',
  'McLaren',
  'Racing Point',
  'Alpine',
  'Haas',
  'Toro Rosso',
  'Williams',
  'Alfa Romeo',
] as const;

const TAGS_2019 = [
  'RB15',
  'W10',
  'SF90 scarlet',
  'MCL34',
  'RP19 pink',
  'R.S.19 Enstone',
  'VF-19',
  'STR14 Faenza',
  'FW42',
  'C38 Hinwil',
] as const;

const IMAGES_2019: readonly string[] = [
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/content/dam/fom-website/manual/Misc/2019carlaunches/RedBullRB15/AP-1YFPFHA4H1W11_news.webp',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/content/dam/fom-website/sutton/2019/Germany/Thursday/1017625067-LAT-20190725-_L5R7567.webp',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/content/dam/fom-website/manual/Misc/2019carlaunches/Ferrari/190008_SF90_lateralesinistra.webp',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/content/dam/fom-website/manual/Misc/2019carlaunches/McLarenMCL34/LandoNorris_CarlosSainz_MCL34_Launch2.webp',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/content/dam/fom-website/manual/Misc/2019carlaunches/RacingPoint/f6c54371-227c-4001-bf6e-41d565c10b0b.webp',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/content/dam/fom-website/manual/Misc/2019carlaunches/Renault/fRONT%203%204S.webp',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/content/dam/fom-website/manual/Misc/2019carlaunches/Haas%201.webp',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/content/dam/fom-website/manual/Misc/2019carlaunches/ToroRosso/AP-1YDGC5MQ51W11_hires_jpeg_24bit_rgb_news%20crop.webp',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/content/dam/fom-website/manual/Misc/2019carlaunches/WilliamsF1_17_HiRes.webp',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/content/dam/fom-website/manual/Misc/Williams2019car/ARR_C38_Sideview_Giulia.webp',
];

/** 2025 season machinery — order matches TEAMS_MODERN */
const IMAGES_2025: readonly string[] = [
  'https://www.themanual.com/tachyon/sites/9/2025/02/Red-Bull-Racing-RB21-F1-car-for-the-2025-season-left-front-three-quarter-view.jpg',
  'https://media.formula1.com/image/upload/t_16by9Centre/c_lfill,w_3392/q_auto/v1740000001/fom-website/2025/Mercedes/Formula%201%20header%20templates%20-%202025-02-24T142006.923.webp',
  'https://media.formula1.com/image/upload/t_16by9Centre/c_lfill,w_3392/q_auto/v1740000001/fom-website/2025/Ferrari/Ferrari%20SF-25%20launch%20renders/F677_still_04_v11_169.webp',
  'https://images.ctfassets.net/gy95mqeyjg28/102LBZx6fuFutHzm1FpmsG/050522531f665d14e66edb255f96a9c4/MCL39-Papaya-PR-Inline-1.jpg?w=3840&q=75&fm=webp',
  'https://media.formula1.com/image/upload/t_16by9Centre/c_lfill,w_3392/q_auto/v1740000001/fom-website/2025/Aston%20Martin/AMR25_SHOT2_8K_16x9.webp',
  'https://media.formula1.com/image/upload/t_16by9Centre/c_lfill,w_3392/q_auto/v1740000001/fom-website/2025/Alpine/A525%20livery%20renders/Formula%201%20header%20templates%20(28).webp',
  'https://www.pitdebrief.com/wp-content/uploads/VF-25-Dual-199-scaled.jpg',
  'https://media.formula1.com/image/upload/t_16by9Centre/c_lfill,w_3392/q_auto/v1740000001/fom-website/2025/Racing%20Bulls%20(VCARB)/Formula%201%20header%20templates%20(56).webp',
  'https://cdn.sanity.io/images/fnx611yr/productionv2/519aaf0c0334653b08f52dba36d2c5a9577485b5-4088x3066.jpg?w=1200&auto=format',
  'https://media.formula1.com/image/upload/t_16by9Centre/c_lfill,w_3392/q_auto/v1740000001/fom-website/2025/Kick%20Sauber/Formula%201%20header%20templates%20-%202025-02-21T164124.951.webp',
];

/** 2026 grid — all teams: Formula 1 media (official 2026 assets) */
const IMAGES_2026: readonly string[] = [
  'https://media.formula1.com/image/upload/t_16by9Centre/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/Red%20Bull/SI202601150723.webp',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/Mercedes/Mercedes-AMG%20F1%20W17%20E%20PERFORMANCE%20-%20GR%206.webp',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/Ferrari/G_V027BWQAASNgK.webp',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/McLaren/MCL40_B_Social_1920x1080.webp',
  'https://media.formula1.com/image/upload/t_16by9Centre/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/Aston%20Martin/GD2_2384%20copy.webp',
  'https://media.formula1.com/image/upload/t_16by9South/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/Alpine/TWJB_BWT_ALPINE_FORMULA_ONE_TEAM-A526_HERO_SHOT_2.webp',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/Haas/10-Photos-16x9.0006.webp',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/Racing%20Bulls%20(VCARB)/SI202601151062%20(1).webp',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/Williams/f34h_v4-Sainz_169.webp',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/Audi/16x9%20single%20image%20(39).webp',
  'https://media.formula1.com/image/upload/t_16by9Centre/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/Cadillac/CadillacF1Team_2202_HiResEdit.webp',
];

const TEAMS_2026 = [
  'Red Bull Racing',
  'Mercedes',
  'Ferrari',
  'McLaren',
  'Aston Martin',
  'Alpine',
  'Haas',
  'Racing Bulls',
  'Williams',
  'Audi',
  'Cadillac',
] as const;

const TAGS_2026 = [
  'Defending champions',
  'Silver arrows',
  'Scuderia',
  'Papaya momentum',
  'British green',
  'Enstone',
  'American heart',
  'Faenza',
  'Grove',
  'Neckarsulm',
  'Motor City',
] as const;

const TEAMS_MODERN = [
  'Red Bull Racing',
  'Mercedes',
  'Ferrari',
  'McLaren',
  'Aston Martin',
  'Alpine',
  'Haas',
  'RB',
  'Williams',
  'Kick Sauber',
] as const;

const TAGS_MODERN = [
  'Aero philosophy',
  'Hybrid mastery',
  'Maranello',
  'Works team energy',
  'Silverstone',
  'Renault DNA',
  'Kannapolis ties',
  'Italian outfit',
  'Heritage',
  'Hinwil',
] as const;

/** 2023 grid — AlphaTauri leads; order matches IMAGES_2023 */
const TEAMS_2023 = [
  'AlphaTauri',
  'Red Bull Racing',
  'Mercedes',
  'Ferrari',
  'McLaren',
  'Aston Martin',
  'Alpine',
  'Haas',
  'Williams',
  'Alfa Romeo',
] as const;

const TAGS_2023 = [
  'AT04 Faenza',
  'RB19 dominance',
  'W14 black',
  'SF-23 scarlet',
  'MCL60',
  'AMR23 green',
  'A523',
  'VF-23',
  'FW45',
  'C43 Hinwil',
] as const;

const IMAGES_2023: readonly string[] = [
  'https://img.redbull.com/images/w_3000/q_auto,f_auto/redbullcom/2023/2/12/i7dkuh4ur2blfm0j2xr4/scuderia-alphatauri-f1-2023-car-at04',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/fom-website/2023/Red%20Bull/SI202310181537.webp',
  'https://www.goodwood.com/globalassets/.road--racing/race/modern/2023/2-february/mercedes-f1-reveal/mercedes_w14_2023_formula1_goodwood_15022023_05.jpg?rxy=0.5,0.5&width=1920&height=1080',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/content/dam/fom-website/manual/2023/Launches2023/Ferrari2023Launch/Ferrari%20rear%203%204s.webp',
  'https://www.topgear.com/sites/default/files/2023/02/8-McLaren-MCL60.jpg?w=1920&h=1080',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/content/dam/fom-website/manual/Misc/2023manual/Pre-season/February/AMR/AM23_CAR_2548%20TC%2016x9.webp',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/content/dam/fom-website/manual/Misc/2023manual/Pre-season/February/Alpine%202.webp',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/content/dam/fom-website/manual/2023/Haas/Haas-Mag-2.webp',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/content/dam/fom-website/manual/2023/Launches2023/WilliamsLaunch2023/FW45%20Livery%20-%20Front%20-%20AA23.webp',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/content/dam/fom-website/manual/2023/alfa-showcar-1.webp',
];

/** 2022 grid — Williams & Alfa Romeo lead; order matches IMAGES_2022 */
const TEAMS_2022 = [
  'Williams',
  'Alfa Romeo',
  'Red Bull Racing',
  'Mercedes',
  'Ferrari',
  'McLaren',
  'Aston Martin',
  'Alpine',
  'Haas',
  'AlphaTauri',
] as const;

const TAGS_2022 = [
  'FW44',
  'C42 Hinwil',
  'RB18 title run',
  'W13 no sidepods',
  'F1-75 scarlet',
  'MCL36',
  'AMR22 green',
  'A522',
  'VF-22',
  'AT03 Faenza',
] as const;

const IMAGES_2022: readonly string[] = [
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/content/dam/fom-website/manual/Misc/2022manual/WinterFebruary/Williams/Williams-Racing-FW44---Image-1.webp',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/content/dam/fom-website/manual/Misc/2022manual/WinterFebruary/AlfaRomeoLaunch/C42_Front_Left_KUB_4000x3000_96DPI.webp',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/content/dam/fom-website/manual/Misc/2022manual/WinterFebruary/RedBullRB18/SI202202090260_hires_jpeg_24bit_rgb.webp',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/content/dam/fom-website/manual/Misc/2022manual/WinterFebruary/Mercedes/06_W13_Overhead_GR_AKK.webp',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/content/dam/fom-website/manual/Misc/2022manual/WinterFebruary/Ferrari/F1-75_JPG_SPONSOR_00004.webp',
  'https://images.ctfassets.net/gy95mqeyjg28/7727UgGJvWUV7wEayGdUMg/3eef3963121a07eba2eb5b619b066217/Four_team_hero_2022_Team_Launch.jpg?w=3840&q=75&fm=webp&fit=fill',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/content/dam/fom-website/manual/Misc/2022manual/WinterFebruary/AstonMartinAMR22/6762_LS_AM_F1_ST_001_04a_w4_F_RGB_LYRD_AML%20copy.webp',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/content/dam/fom-website/manual/Misc/2022manual/WinterFebruary/AlpineLaunch/A522%20B%20Front.webp',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/content/dam/fom-website/manual/Misc/2022manual/WinterFebruary/HaasVF22Launch/MAZ%20Front.webp',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/content/dam/fom-website/manual/Misc/2022manual/WinterFebruary/AlphaTauri/SI202202140102_news.webp',
];

/** 2010 grid — order matches chassis image list */
const TEAMS_2010 = [
  'Red Bull Racing',
  'McLaren',
  'Ferrari',
  'Mercedes',
  'Renault',
  'Williams',
  'Force India',
  'Sauber',
  'Toro Rosso',
  'Lotus',
] as const;

const TAGS_2010 = [
  'RB6 title year',
  'Vodafone MP4-25',
  'F10 scarlet',
  'Brackley return',
  'R30 black & gold',
  'FW32 Cosworth',
  'Silverstone pink',
  'C29 Hinwil',
  'STR5 Faenza',
  'Lotus comeback',
] as const;

const IMAGES_2010: readonly string[] = [
  'https://upload.wikimedia.org/wikipedia/commons/f/f4/Vettel_Bahrain_2010_%28cropped%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/a/af/Lewis_Hamilton_2010_Japan_2nd_Free_Practice_2.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/1/13/Felipe_Massa_Ferrari_Bahrain_2010_GP.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/5/5e/Schumacher_Mercedes_Jerez_%28cropped%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/8/85/Kubica_Bahrain_Grand_Prix_2010_%28cropped%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/5/54/Nico_Hulkenberg_2010_Malaysia_2nd_Free_Practice.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/c/c7/Liuzzi_Bahrain_2010_%28cropped%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/9/9c/Sauber_Bahrain_2010.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/f/f0/Toro_Rosso_STR5_Bahrain_2010_%28cropped%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/c/c0/Lotus_in_Bahrain_%28cropped%29_2010.jpg',
];

function rowsForSeason(
  teamNames: readonly string[],
  taglines: readonly string[],
  images: readonly string[]
): GenerationTeamRow[] {
  return teamNames.map((name, i) => ({
    name,
    tagline: taglines[i] ?? 'Grand Prix challenger',
    image: images[i] ?? images[0]!,
    teamSlug: teamNameToSlug(name) ?? 'red-bull-racing',
  }));
}

export function generationTeamShowcase(year: number): GenerationTeamRow[] | null {
  if (year === 2010) return rowsForSeason(TEAMS_2010, TAGS_2010, IMAGES_2010);
  if (year === 2019) return rowsForSeason(TEAMS_2019, TAGS_2019, IMAGES_2019);
  if (year < 2022) return null;
  if (year >= 2026) return rowsForSeason(TEAMS_2026, TAGS_2026, IMAGES_2026);
  if (year === 2025) return rowsForSeason(TEAMS_MODERN, TAGS_MODERN, IMAGES_2025);
  if (year === 2023) return rowsForSeason(TEAMS_2023, TAGS_2023, IMAGES_2023);
  if (year === 2022) return rowsForSeason(TEAMS_2022, TAGS_2022, IMAGES_2022);
  return rowsForSeason(TEAMS_MODERN, TAGS_MODERN, IMAGES_2024);
}

export function defaultGenerationsYear(availableYears: number[]): number {
  if (availableYears.length === 0) return new Date().getFullYear();
  if (availableYears.includes(2026)) return 2026;
  return availableYears[0]!;
}

/** Narrow strip for the top nav hover preview — current grid (2025) cars, left-to-right order. */
export function carsNavStripShowcase(): { name: string; image: string }[] {
  const rows = generationTeamShowcase(2025);
  if (!rows) return [];
  return rows.map((r) => ({ name: r.name, image: r.image }));
}
