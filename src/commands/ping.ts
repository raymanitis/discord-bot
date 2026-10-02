import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types.js";

export default {
  data: new SlashCommandBuilder().setName("ping").setDescription("Check the bot's latency"),
  async execute(interaction, { client }) {
    const sent = Date.now();
    await interaction.reply("Pinging...");
    await interaction.editReply(
      `🏓 Pong! Round trip: **${Date.now() - sent}ms** · WebSocket: **${client.ws.ping}ms**`,
    );
  },
} satisfies Command;
