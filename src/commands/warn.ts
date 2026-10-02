import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder, time } from "discord.js";
import { embed, errorEmbed, successEmbed, COLORS } from "../lib/embeds.js";
import { sendLog } from "../lib/modlog.js";
import type { Command } from "../types.js";

export default {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Manage member warnings")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false)
    .addSubcommand((s) =>
      s
        .setName("add")
        .setDescription("Warn a member")
        .addUserOption((o) => o.setName("user").setDescription("Who to warn").setRequired(true))
        .addStringOption((o) => o.setName("reason").setDescription("Why").setRequired(true).setMaxLength(300)),
    )
    .addSubcommand((s) =>
      s
        .setName("list")
        .setDescription("List a member's warnings")
        .addUserOption((o) => o.setName("user").setDescription("Whose warnings").setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName("remove")
        .setDescription("Remove a warning by ID")
        .addIntegerOption((o) => o.setName("id").setDescription("Warning ID").setRequired(true)),
    ),

  async execute(interaction, ctx) {
    const guildId = interaction.guildId!;
    const sub = interaction.options.getSubcommand();

    if (sub === "add") {
      const user = interaction.options.getUser("user", true);
      const reason = interaction.options.getString("reason", true);
      if (user.bot) {
        return interaction.reply({ embeds: [errorEmbed("You can't warn a bot.")], flags: MessageFlags.Ephemeral });
      }
      const id = ctx.store.addWarning({ guildId, userId: user.id, moderatorId: interaction.user.id, reason });
      const count = ctx.store.listWarnings(guildId, user.id).length;

      await user
        .send(`⚠️ You were warned in **${interaction.guild?.name}**: ${reason}`)
        .catch(() => undefined); // user may have DMs off
      await interaction.reply({ embeds: [successEmbed(`Warned ${user} (#${id}). They now have **${count}** warning(s).`)] });
      await sendLog(ctx, guildId, `⚠️ ${interaction.user} warned ${user}: ${reason} (#${id})`);
      return;
    }

    if (sub === "list") {
      const user = interaction.options.getUser("user", true);
      const warnings = ctx.store.listWarnings(guildId, user.id);
      const e = embed(COLORS.warn).setTitle(`Warnings for ${user.tag}`);
      e.setDescription(
        warnings.length === 0
          ? "No warnings. 🎉"
          : warnings
              .slice(0, 20)
              .map((w) => `**#${w.id}** · ${time(new Date(w.createdAt), "d")} · by <@${w.moderatorId}>\n${w.reason}`)
              .join("\n\n"),
      );
      return interaction.reply({ embeds: [e], flags: MessageFlags.Ephemeral });
    }

    const id = interaction.options.getInteger("id", true);
    const removed = ctx.store.removeWarning(guildId, id);
    await interaction.reply({
      embeds: [removed ? successEmbed(`Removed warning #${id}.`) : errorEmbed(`No warning #${id} in this server.`)],
      flags: MessageFlags.Ephemeral,
    });
    if (removed) await sendLog(ctx, guildId, `🗑️ ${interaction.user} removed warning #${id}`);
  },
} satisfies Command;
