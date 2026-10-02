import { describe, expect, it } from "vitest";
import { Cooldowns } from "../src/lib/cooldown.js";
import { formatDuration, parseDuration } from "../src/lib/duration.js";
import { parsePollOptions, progressBar, tallyVotes } from "../src/lib/poll.js";
import { renderTemplate } from "../src/lib/template.js";

describe("parseDuration", () => {
  it.each([
    ["10s", 10_000],
    ["5m", 300_000],
    ["1h30m", 5_400_000],
    ["2d 4h", 187_200_000],
    ["1W", 604_800_000],
  ])("parses %s", (input, ms) => expect(parseDuration(input)).toBe(ms));

  it.each(["", "abc", "10", "5x", "0m", "-5m", "1h foo"])("rejects %j", (input) =>
    expect(parseDuration(input)).toBeNull(),
  );
});

describe("formatDuration", () => {
  it("formats compound durations", () => {
    expect(formatDuration(5_400_000)).toBe("1h 30m");
    expect(formatDuration(90_061_000)).toBe("1d 1h 1m 1s");
    expect(formatDuration(0)).toBe("0s");
  });

  it("round-trips with parseDuration", () => {
    expect(parseDuration(formatDuration(187_200_000))).toBe(187_200_000);
  });
});

describe("polls", () => {
  it("parses options, trimming and removing duplicates", () => {
    expect(parsePollOptions(" Pizza, burgers | pizza ,, Tacos ")).toEqual(["Pizza", "burgers", "Tacos"]);
  });

  it("tallies votes and percentages", () => {
    expect(tallyVotes(["A", "B", "C"], [0, 0, 1, 7])).toEqual([
      { option: "A", votes: 2, percent: 50 },
      { option: "B", votes: 1, percent: 25 },
      { option: "C", votes: 0, percent: 0 },
    ]);
  });

  it("handles no votes", () => {
    expect(tallyVotes(["A", "B"], []).every((r) => r.percent === 0)).toBe(true);
  });

  it("draws a progress bar of fixed width", () => {
    expect(progressBar(50, 10)).toBe("█████░░░░░");
    expect(progressBar(150, 4)).toBe("████");
    expect(progressBar(-5, 4)).toBe("░░░░");
  });
});

describe("renderTemplate", () => {
  it("fills known placeholders and leaves unknown ones", () => {
    expect(renderTemplate("Hi {user}, welcome to {server}! {nope}", { user: "<@1>", server: "Test" })).toBe(
      "Hi <@1>, welcome to Test! {nope}",
    );
  });
});

describe("Cooldowns", () => {
  it("blocks repeat use until the cooldown passes", () => {
    const c = new Cooldowns();
    expect(c.check("poll", "u1", 10, 0)).toBe(0);
    expect(c.check("poll", "u1", 10, 3_000)).toBe(7);
    expect(c.check("poll", "u2", 10, 3_000)).toBe(0); // other user unaffected
    expect(c.check("poll", "u1", 10, 10_000)).toBe(0);
  });

  it("does nothing for commands without a cooldown", () => {
    const c = new Cooldowns();
    expect(c.check("ping", "u1", 0, 0)).toBe(0);
    expect(c.check("ping", "u1", 0, 1)).toBe(0);
  });
});
