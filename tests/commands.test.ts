import { describe, expect, it, vi } from "vitest";
import { commands } from "../src/commands/index.js";
import { Store } from "../src/db.js";
import type { Context } from "../src/types.js";

describe("command registry", () => {
  it("every command builds valid JSON for Discord", () => {
    for (const cmd of commands.values()) {
      const json = cmd.data.toJSON();
      expect(json.name).toMatch(/^[a-z0-9_-]{1,32}$/);
      expect(json.description.length).toBeGreaterThan(0);
      expect(json.description.length).toBeLessThanOrEqual(100);
    }
  });

  it("has unique names", () => {
    const names = [...commands.values()].map((c) => c.data.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("/poll buttons", () => {
  const ctx = { store: new Store(":memory:"), client: {} } as unknown as Context;
  const poll = commands.get("poll")!;

  const button = (customId: string, userId: string, canManage = false) => ({
    customId,
    user: { id: userId },
    memberPermissions: { has: () => canManage },
    update: vi.fn(),
    reply: vi.fn(),
  });

  it("records a vote and re-renders the poll", async () => {
    const id = ctx.store.createPoll("Lunch?", ["Pizza", "Sushi"], "author");
    const i = button(`poll:vote:${id}:1`, "voter");
    await poll.handleButton!(i as never, ctx);

    expect(ctx.store.pollVotes(id)).toEqual([1]);
    const embed = i.update.mock.calls[0]![0].embeds[0].toJSON();
    expect(embed.footer.text).toBe("1 vote");
  });

  it("only lets the author or mods close a poll", async () => {
    const id = ctx.store.createPoll("Q", ["A", "B"], "author");

    const stranger = button(`poll:close:${id}`, "someone");
    await poll.handleButton!(stranger as never, ctx);
    expect(stranger.reply).toHaveBeenCalled();
    expect(ctx.store.getPoll(id)?.closed).toBe(false);

    const author = button(`poll:close:${id}`, "author");
    await poll.handleButton!(author as never, ctx);
    expect(ctx.store.getPoll(id)?.closed).toBe(true);
  });

  it("rejects votes on a closed poll", async () => {
    const id = ctx.store.createPoll("Q", ["A", "B"], "author");
    ctx.store.closePoll(id);
    const i = button(`poll:vote:${id}:0`, "late");
    await poll.handleButton!(i as never, ctx);
    expect(i.update).not.toHaveBeenCalled();
    expect(ctx.store.pollVotes(id)).toEqual([]);
  });
});
