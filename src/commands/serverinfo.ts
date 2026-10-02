import { SlashCommandBuilder, time } from "discord.js";
import { embed } from "../lib/embeds.js";
import type { Command } from "../types.js";

export default {
  data: new SlashCommandBuilder().setName("serverinfo").setDescription("Show info about this server"),
  async execute(interaction) {
    const guild = interaction.guild;
    if (!guild) return interaction.reply("This only works in a server.");

    const owner = await guild.fetchOwner().catch(() => null);
    await interaction.reply({
      embeds: [
        embed()
          .setTitle(guild.name)
          .setThumbnail(guild.iconURL({ size: 256 }))
          .addFields(
            { name: "Owner", value: owner?.user.tag ?? "Unknown", inline: true },
            { name: "Members", value: String(guild.memberCount), inline: true },
            { name: "Created", value: time(guild.createdAt, "R"), inline: true },
            { name: "Channels", value: String(guild.channels.cache.size), inline: true },
            { name: "Roles", value: String(guild.roles.cache.size), inline: true },
            { name: "Boosts", value: String(guild.premiumSubscriptionCount ?? 0), inline: true },
          ),
      ],
    });
  },
} satisfies Command;
