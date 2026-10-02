import { ChannelType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { embed, successEmbed } from "../lib/embeds.js";
import { DEFAULT_WELCOME } from "../lib/template.js";
import type { Command } from "../types.js";

export default {
  data: new SlashCommandBuilder()
    .setName("settings")
    .setDescription("Configure the bot for this server")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)
    .addSubcommand((s) => s.setName("view").setDescription("Show current settings"))
    .addSubcommand((s) =>
      s
        .setName("welcome")
        .setDescription("Set the welcome channel and message")
        .addChannelOption((o) =>
          o.setName("channel").setDescription("Leave empty to turn welcomes off").addChannelTypes(ChannelType.GuildText),
        )
        .addStringOption((o) =>
          o
            .setName("message")
            .setDescription("Placeholders: {user} {username} {server} {memberCount}")
            .setMaxLength(500),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("logs")
        .setDescription("Set the moderation log channel")
        .addChannelOption((o) =>
          o.setName("channel").setDescription("Leave empty to turn logs off").addChannelTypes(ChannelType.GuildText),
        ),
    ),

  async execute(interaction, { store }) {
    const guildId = interaction.guildId!;
    const sub = interaction.options.getSubcommand();

    if (sub === "welcome") {
      const channel = interaction.options.getChannel("channel");
      const message = interaction.options.getString("message");
      store.updateSettings(guildId, {
        welcomeChannelId: channel?.id ?? null,
        ...(message ? { welcomeMessage: message } : {}),
      });
      return interaction.reply({
        embeds: [successEmbed(channel ? `Welcome messages will go to ${channel}.` : "Welcome messages turned off.")],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === "logs") {
      const channel = interaction.options.getChannel("channel");
      store.updateSettings(guildId, { logChannelId: channel?.id ?? null });
      return interaction.reply({
        embeds: [successEmbed(channel ? `Mod logs will go to ${channel}.` : "Mod logs turned off.")],
        flags: MessageFlags.Ephemeral,
      });
    }

    const s = store.getSettings(guildId);
    const fmt = (id: string | null) => (id ? `<#${id}>` : "Off");
    await interaction.reply({
      embeds: [
        embed()
          .setTitle("Server settings")
          .addFields(
            { name: "Welcome channel", value: fmt(s.welcomeChannelId), inline: true },
            { name: "Log channel", value: fmt(s.logChannelId), inline: true },
            { name: "Welcome message", value: s.welcomeMessage ?? `${DEFAULT_WELCOME} *(default)*` },
          ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
} satisfies Command;
