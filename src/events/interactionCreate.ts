import { MessageFlags, type Interaction } from "discord.js";
import { commands } from "../commands/index.js";
import { Cooldowns } from "../lib/cooldown.js";
import { errorEmbed } from "../lib/embeds.js";
import { logger } from "../logger.js";
import type { Context } from "../types.js";

const cooldowns = new Cooldowns();

export async function onInteraction(interaction: Interaction, ctx: Context) {
  try {
    if (interaction.isChatInputCommand()) {
      const command = commands.get(interaction.commandName);
      if (!command) return;

      const wait = cooldowns.check(command.data.name, interaction.user.id, command.cooldown ?? 0);
      if (wait > 0) {
        await interaction.reply({
          embeds: [errorEmbed(`Slow down! Try again in ${wait}s.`)],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      logger.debug({ command: command.data.name, user: interaction.user.id }, "command");
      await command.execute(interaction, ctx);
      return;
    }

    if (interaction.isButton()) {
      const name = interaction.customId.split(":")[0]!;
      await commands.get(name)?.handleButton?.(interaction, ctx);
    }
  } catch (err) {
    logger.error({ err }, "interaction failed");
    if (interaction.isRepliable()) {
      const payload = { embeds: [errorEmbed("Something went wrong. Please try again.")], flags: MessageFlags.Ephemeral } as const;
      if (interaction.replied || interaction.deferred) await interaction.followUp(payload).catch(() => undefined);
      else await interaction.reply(payload).catch(() => undefined);
    }
  }
}
