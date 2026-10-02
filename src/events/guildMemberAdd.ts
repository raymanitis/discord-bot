import type { GuildMember } from "discord.js";
import { DEFAULT_WELCOME, renderTemplate } from "../lib/template.js";
import { logger } from "../logger.js";
import type { Context } from "../types.js";

export async function onMemberJoin(member: GuildMember, { client, store }: Context) {
  const { welcomeChannelId, welcomeMessage } = store.getSettings(member.guild.id);
  if (!welcomeChannelId) return;

  const channel = await client.channels.fetch(welcomeChannelId).catch(() => null);
  if (!channel?.isSendable()) {
    logger.warn({ guild: member.guild.id }, "welcome channel missing or not sendable");
    return;
  }
  await channel.send(
    renderTemplate(welcomeMessage ?? DEFAULT_WELCOME, {
      user: member.toString(),
      username: member.user.username,
      server: member.guild.name,
      memberCount: member.guild.memberCount,
    }),
  );
}
