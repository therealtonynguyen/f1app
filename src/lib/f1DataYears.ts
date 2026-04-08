/** Earliest season year offered in the Data session picker (OpenF1 coverage varies by year). */
export const MIN_F1_DATA_YEAR = 2006;

export function dataSeasonYearsDescending(): number[] {
  const y = new Date().getFullYear();
  const n = y - MIN_F1_DATA_YEAR + 1;
  return Array.from({ length: n }, (_, i) => y - i);
}
