import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Store } from "../src/db.js";

let store: Store;
beforeEach(() => (store = new Store(":memory:")));
afterEach(() => store.close());

describe("settings", () => {
  it("returns defaults for a new server", () => {
    expect(store.getSettings("g1")).toEqual({ welcomeChannelId: null, welcomeMessage: null, logChannelId: null });
  });

  it("merges partial updates", () => {
    store.updateSettings("g1", { welcomeChannelId: "c1" });
    store.updateSettings("g1", { logChannelId: "c2" });
    expect(store.getSettings("g1")).toEqual({ welcomeChannelId: "c1", welcomeMessage: null, logChannelId: "c2" });
  });
});

describe("warnings", () => {
  it("adds, lists newest first and removes", () => {
    const base = { guildId: "g1", userId: "u1", moderatorId: "m1" };
    store.addWarning({ ...base, reason: "spam" }, 1000);
    const second = store.addWarning({ ...base, reason: "rude" }, 2000);
    store.addWarning({ ...base, guildId: "g2", reason: "other server" });

    expect(store.listWarnings("g1", "u1").map((w) => w.reason)).toEqual(["rude", "spam"]);
    expect(store.removeWarning("g2", second)).toBe(false); // wrong server
    expect(store.removeWarning("g1", second)).toBe(true);
    expect(store.listWarnings("g1", "u1")).toHaveLength(1);
  });
});

describe("reminders", () => {
  it("returns only due reminders", () => {
    store.addReminder({ userId: "u1", channelId: "c1", message: "soon", dueAt: 100 });
    store.addReminder({ userId: "u1", channelId: "c1", message: "later", dueAt: 500 });
    expect(store.dueReminders(200).map((r) => r.message)).toEqual(["soon"]);
  });
});

describe("polls", () => {
  it("keeps one vote per user and lets them change it", () => {
    const id = store.createPoll("Lunch?", ["Pizza", "Sushi"], "author");
    store.vote(id, "u1", 0);
    store.vote(id, "u2", 0);
    store.vote(id, "u1", 1);
    expect(store.pollVotes(id).sort()).toEqual([0, 1]);
  });

  it("closes polls", () => {
    const id = store.createPoll("Q", ["A", "B"], "author");
    store.closePoll(id);
    expect(store.getPoll(id)?.closed).toBe(true);
    expect(store.getPoll(999)).toBeNull();
  });
});
