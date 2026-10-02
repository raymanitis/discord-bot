import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { errorEmbed, successEmbed } from "../lib/embeds.js";
import { sendLog } from "../lib/modlog.js";
import type { Command } from "../types.js";

export default {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Delete recent messages in this channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false)
    .addIntegerOption((o) =>
      o.setName("amount").setDescription("How many (1-100)").setRequired(true).setMinValue(1).setMaxValue(100),
    )
    .addUserOption((o) => o.setName("user").setDescription("Only delete messages from this user")),

  async execute(interaction, ctx) {
    const channel = interaction.channel;
    if (!channel || !("bulkDelete" in channel)) {
      return interaction.reply({ embeds: [errorEmbed("Can't clear messages here.")], flags: MessageFlags.Ephemeral });
    }
    const amount = interaction.options.getInteger("amount", true);
    const user = interaction.options.getUser("user");

    let messages = await channel.messages.fetch({ limit: 100 });
    if (user) messages = messages.filter((m) => m.author.id === user.id);
    const toDelete = [...messages.values()].slice(0, amount);

    // Discord can only bulk delete messages newer than 14 days; `true` skips older ones.
    const deleted = await channel.bulkDelete(toDelete, true);
    await interaction.reply({
      embeds: [successEmbed(`Deleted **${deleted.size}** message(s)${user ? ` from ${user}` : ""}.`)],
      flags: MessageFlags.Ephemeral,
    });
    await sendLog(ctx, interaction.guildId!, `🧹 ${interaction.user} cleared ${deleted.size} message(s) in ${channel}`);
  },
} satisfies Command;
