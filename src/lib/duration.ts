const UNITS: Record<string, number> = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 604_800_000,
};

/**
 * Parses strings like "10m", "1h30m", "2d 4h" into milliseconds.
 * Returns null when the input is not a valid duration.
 */
export function parseDuration(input: string): number | null {
  const clean = input.toLowerCase().replace(/\s+/g, "");
  if (!/^(\d+[smhdw])+$/.test(clean)) return null;

  let total = 0;
  for (const [, amount, unit] of clean.matchAll(/(\d+)([smhdw])/g)) {
    total += Number(amount) * UNITS[unit!]!;
  }
  return total > 0 ? total : null;
}

/** Formats milliseconds as a short human string, e.g. 5_400_000 -> "1h 30m". */
export function formatDuration(ms: number): string {
  const parts: string[] = [];
  for (const [unit, size] of [["d", 86_400_000], ["h", 3_600_000], ["m", 60_000], ["s", 1_000]] as const) {
    const n = Math.floor(ms / size);
    if (n > 0) {
      parts.push(`${n}${unit}`);
      ms -= n * size;
    }
  }
  return parts.join(" ") || "0s";
}
