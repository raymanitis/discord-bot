import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";

describe("loadConfig", () => {
  it("applies defaults", () => {
    const c = loadConfig({ DISCORD_TOKEN: "t", CLIENT_ID: "1", GUILD_ID: "" });
    expect(c.DATABASE_PATH).toBe("./data/bot.db");
    expect(c.GUILD_ID).toBeUndefined();
  });

  it("explains what is missing", () => {
    expect(() => loadConfig({})).toThrow(/DISCORD_TOKEN/);
  });
});
