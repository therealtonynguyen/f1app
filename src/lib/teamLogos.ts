/**
 * Map OpenF1 `team_name` strings to a stable logo image URL (Wikimedia Commons).
 * Order: more specific patterns first (e.g. Racing Bulls before Red Bull).
 */
const TEAM_LOGO_MATCHES: { patterns: string[]; url: string }[] = [
  {
    patterns: ['visa cash', 'racing bull', 'vcarb', 'alphatauri', 'rb f1'],
    url: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5e/Scuderia_AlphaTauri_Logo.svg/200px-Scuderia_AlphaTauri_Logo.svg.png',
  },
  {
    patterns: ['red bull'],
    url: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9a/Red_Bull_Racing_logo.svg/200px-Red_Bull_Racing_logo.svg.png',
  },
  {
    patterns: ['mclaren'],
    url: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6f/McLaren_Racing_logo.svg/200px-McLaren_Racing_logo.svg.png',
  },
  {
    patterns: ['ferrari'],
    url: 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2c/Scuderia_Ferrari_Logo.svg/200px-Scuderia_Ferrari_Logo.svg.png',
  },
  {
    patterns: ['mercedes'],
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Mercedes_AMG_Petronas_F1_Logo.svg/200px-Mercedes_AMG_Petronas_F1_Logo.svg.png',
  },
  {
    patterns: ['aston martin'],
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Aston_Martin_Aramco_Formula_One_Team_logo.svg/200px-Aston_Martin_Aramco_Formula_One_Team_logo.svg.png',
  },
  {
    patterns: ['alpine'],
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Alpine_F1_Team_Logo.svg/200px-Alpine_F1_Team_Logo.svg.png',
  },
  {
    patterns: ['kick', 'sauber', 'stake'],
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Sauber_F1_logo.svg/200px-Sauber_F1_logo.svg.png',
  },
  {
    patterns: ['haas'],
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Haas_F1_Team_Logo.svg/200px-Haas_F1_Team_Logo.svg.png',
  },
  {
    patterns: ['williams'],
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Williams_Racing_logo.svg/200px-Williams_Racing_logo.svg.png',
  },
  {
    patterns: ['audi'],
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Audi-Logo_2016.svg/200px-Audi-Logo_2016.svg.png',
  },
];

export function teamLogoUrl(teamName: string): string | null {
  const n = teamName.toLowerCase();
  for (const { patterns, url } of TEAM_LOGO_MATCHES) {
    for (const p of patterns) {
      if (n.includes(p)) return url;
    }
  }
  return null;
}
