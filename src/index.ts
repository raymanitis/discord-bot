import { ActivityType, Client, Events, GatewayIntentBits } from "discord.js";
import { loadConfig } from "./config.js";
import { Store } from "./db.js";
import { onMemberJoin } from "./events/guildMemberAdd.js";
import { onInteraction } from "./events/interactionCreate.js";
import { startReminderLoop } from "./lib/reminders.js";
import { logger } from "./logger.js";
import type { Context } from "./types.js";

const config = loadConfig();
const store = new Store(config.DATABASE_PATH);

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

const ctx: Context = { client, store };
let stopReminders: (() => void) | undefined;

client.once(Events.ClientReady, (c) => {
  logger.info(`Logged in as ${c.user.tag} in ${c.guilds.cache.size} server(s)`);
  c.user.setActivity("/help", { type: ActivityType.Listening });
  stopReminders = startReminderLoop(client, store);
});

client.on(Events.InteractionCreate, (i) => void onInteraction(i, ctx));
client.on(Events.GuildMemberAdd, (m) => void onMemberJoin(m, ctx).catch((err) => logger.error({ err }, "welcome failed")));

async function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down`);
  stopReminders?.();
  await client.destroy();
  store.close();
  process.exit(0);
}
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

await client.login(config.DISCORD_TOKEN);
