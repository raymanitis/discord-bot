export interface PollResult {
  option: string;
  votes: number;
  percent: number;
}

export const MAX_POLL_OPTIONS = 5;

/** Splits "Pizza, Burgers | Tacos" into clean, unique options. */
export function parsePollOptions(input: string): string[] {
  const seen = new Set<string>();
  const options: string[] = [];
  for (const raw of input.split(/[,|]/)) {
    const opt = raw.trim().slice(0, 80);
    if (opt && !seen.has(opt.toLowerCase())) {
      seen.add(opt.toLowerCase());
      options.push(opt);
    }
  }
  return options;
}

/** votes: optionIndex for every voter. */
export function tallyVotes(options: string[], votes: number[]): PollResult[] {
  const counts = options.map(() => 0);
  for (const v of votes) if (v >= 0 && v < counts.length) counts[v]!++;
  const total = votes.length;
  return options.map((option, i) => ({
    option,
    votes: counts[i]!,
    percent: total === 0 ? 0 : Math.round((counts[i]! / total) * 100),
  }));
}

export function progressBar(percent: number, width = 12): string {
  const filled = Math.round((Math.max(0, Math.min(100, percent)) / 100) * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}

export function renderResults(results: PollResult[]): string {
  return results
    .map((r) => `**${r.option}**\n\`${progressBar(r.percent)}\` ${r.percent}% (${r.votes})`)
    .join("\n\n");
}
