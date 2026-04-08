/** Step-wise: last sample with `t <= queryT` (same convention as GPS replay). */
export function interpolateReplayPosition(
  samples: { t: number; position: number }[],
  queryT: number
): number | null {
  if (samples.length === 0) return null;
  if (queryT < samples[0]!.t) return samples[0]!.position;
  let lo = 0;
  for (let i = 0; i < samples.length; i++) {
    if (samples[i]!.t <= queryT) lo = i;
    else break;
  }
  return samples[lo]!.position;
}
