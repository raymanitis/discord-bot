/** Tracks per-user, per-command cooldowns in memory. */
export class Cooldowns {
  private last = new Map<string, number>();

  /** Returns seconds left if on cooldown, otherwise records the use and returns 0. */
  check(command: string, userId: string, seconds: number, now = Date.now()): number {
    if (seconds <= 0) return 0;
    const key = `${command}:${userId}`;
    const prev = this.last.get(key);
    if (prev !== undefined && now - prev < seconds * 1000) {
      return Math.ceil((seconds * 1000 - (now - prev)) / 1000);
    }
    this.last.set(key, now);
    return 0;
  }
}
