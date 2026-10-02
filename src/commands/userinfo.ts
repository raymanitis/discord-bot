import { SlashCommandBuilder, time } from "discord.js";
import { embed } from "../lib/embeds.js";
import type { Command } from "../types.js";

export default {
  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Show info about a user")
    .addUserOption((o) => o.setName("user").setDescription("Who to look up (default: you)")),
  async execute(interaction) {
    const user = interaction.options.getUser("user") ?? interaction.user;
    const member = interaction.guild?.members.cache.get(user.id) ?? (await interaction.guild?.members.fetch(user.id).catch(() => null));

    const e = embed()
      .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "ID", value: user.id, inline: true },
        { name: "Bot", value: user.bot ? "Yes" : "No", inline: true },
        { name: "Account created", value: time(user.createdAt, "R"), inline: true },
      );

    if (member?.joinedAt) {
      const roles = member.roles.cache
        .filter((r) => r.id !== interaction.guildId)
        .sort((a, b) => b.position - a.position)
        .map((r) => r.toString());
      e.addFields(
        { name: "Joined server", value: time(member.joinedAt, "R"), inline: true },
        { name: `Roles (${roles.length})`, value: roles.slice(0, 15).join(" ") || "None" },
      );
    }
    await interaction.reply({ embeds: [e] });
  },
} satisfies Command;
