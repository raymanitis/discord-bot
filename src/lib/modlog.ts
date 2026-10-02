import type { Context } from "../types.js";

/** Posts a line to the server's configured log channel, if there is one. */
export async function sendLog({ client, store }: Context, guildId: string, text: string) {
  const { logChannelId } = store.getSettings(guildId);
  if (!logChannelId) return;
  const channel = await client.channels.fetch(logChannelId).catch(() => null);
  if (channel?.isSendable()) await channel.send({ content: text, allowedMentions: { parse: [] } });
}
