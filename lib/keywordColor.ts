export function rainbowColorByRank(rank: number, total: number): string {
  const safeTotal = Math.max(1, total);
  const t = safeTotal <= 1 ? 0 : rank / (safeTotal - 1);
  const hue = Math.round(360 * t);
  return `hsl(${hue} 78% 44%)`;
}

