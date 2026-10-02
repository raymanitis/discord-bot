import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { embed } from "../lib/embeds.js";
import type { Command } from "../types.js";

export default {
  data: new SlashCommandBuilder().setName("help").setDescription("List all commands"),
  async execute(interaction) {
    // Imported lazily to avoid a circular import with the registry.
    const { commands } = await import("./index.js");
    const lines = [...commands.values()].map((c) => `**/${c.data.name}** · ${c.data.description}`);
    await interaction.reply({
      embeds: [embed().setTitle("Commands").setDescription(lines.join("\n"))],
      flags: MessageFlags.Ephemeral,
    });
  },
} satisfies Command;
