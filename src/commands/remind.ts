import { MessageFlags, SlashCommandBuilder, time } from "discord.js";
import { formatDuration, parseDuration } from "../lib/duration.js";
import { errorEmbed, successEmbed } from "../lib/embeds.js";
import type { Command } from "../types.js";

const MAX_MS = 365 * 86_400_000;

export default {
  data: new SlashCommandBuilder()
    .setName("remind")
    .setDescription("Get a reminder later")
    .addStringOption((o) => o.setName("in").setDescription("When, e.g. 10m, 2h, 1d 4h").setRequired(true))
    .addStringOption((o) => o.setName("message").setDescription("What to remind you about").setRequired(true).setMaxLength(500)),
  cooldown: 3,

  async execute(interaction, { store }) {
    const ms = parseDuration(interaction.options.getString("in", true));
    if (ms === null || ms > MAX_MS) {
      return interaction.reply({
        embeds: [errorEmbed("Use a time like `10m`, `2h` or `1d 4h` (max 1 year).")],
        flags: MessageFlags.Ephemeral,
      });
    }
    const dueAt = Date.now() + ms;
    store.addReminder({
      userId: interaction.user.id,
      channelId: interaction.channelId,
      message: interaction.options.getString("message", true),
      dueAt,
    });
    await interaction.reply({
      embeds: [successEmbed(`I'll remind you in **${formatDuration(ms)}** (${time(new Date(dueAt), "f")}).`)],
      flags: MessageFlags.Ephemeral,
    });
  },
} satisfies Command;
