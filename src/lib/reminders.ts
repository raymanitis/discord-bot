import type { Client } from "discord.js";
import type { Store } from "../db.js";
import { logger } from "../logger.js";

/**
 * Checks for due reminders every few seconds. Reminders live in the
 * database, so they survive restarts.
 */
export function startReminderLoop(client: Client, store: Store, intervalMs = 10_000) {
  const tick = async () => {
    for (const r of store.dueReminders()) {
      try {
        const channel = await client.channels.fetch(r.channelId).catch(() => null);
        const text = `⏰ <@${r.userId}> reminder: ${r.message}`;
        if (channel?.isSendable()) {
          await channel.send({ content: text, allowedMentions: { users: [r.userId] } });
        } else {
          const user = await client.users.fetch(r.userId);
          await user.send(text);
        }
      } catch (err) {
        logger.warn({ err, reminder: r.id }, "could not deliver reminder");
      } finally {
        store.deleteReminder(r.id);
      }
    }
  };
  const timer = setInterval(() => void tick(), intervalMs);
  void tick();
  return () => clearInterval(timer);
}
