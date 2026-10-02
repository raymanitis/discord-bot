import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, SlashCommandBuilder } from "discord.js";
import { embed, errorEmbed } from "../lib/embeds.js";
import { MAX_POLL_OPTIONS, parsePollOptions, renderResults, tallyVotes } from "../lib/poll.js";
import type { Store } from "../db.js";
import type { Command } from "../types.js";

function pollMessage(store: Store, pollId: number) {
  const poll = store.getPoll(pollId)!;
  const votes = store.pollVotes(pollId);
  const results = tallyVotes(poll.options, votes);

  const e = embed()
    .setTitle(`📊 ${poll.question}`)
    .setDescription(renderResults(results))
    .setFooter({ text: `${votes.length} vote${votes.length === 1 ? "" : "s"}${poll.closed ? " · Closed" : ""}` });

  const voteRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    poll.options.map((opt, i) =>
      new ButtonBuilder()
        .setCustomId(`poll:vote:${pollId}:${i}`)
        .setLabel(opt.slice(0, 80))
        .setStyle(ButtonStyle.Primary)
        .setDisabled(poll.closed),
    ),
  );
  const controlRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`poll:close:${pollId}`)
      .setLabel("Close poll")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(poll.closed),
  );
  return { embeds: [e], components: [voteRow, controlRow] };
}

export default {
  data: new SlashCommandBuilder()
    .setName("poll")
    .setDescription("Start a poll with buttons")
    .addStringOption((o) => o.setName("question").setDescription("What to ask").setRequired(true).setMaxLength(200))
    .addStringOption((o) =>
      o.setName("options").setDescription(`2-${MAX_POLL_OPTIONS} options, separated by commas`).setRequired(true),
    ),
  cooldown: 10,

  async execute(interaction, { store }) {
    const question = interaction.options.getString("question", true);
    const options = parsePollOptions(interaction.options.getString("options", true));
    if (options.length < 2 || options.length > MAX_POLL_OPTIONS) {
      return interaction.reply({
        embeds: [errorEmbed(`Give between 2 and ${MAX_POLL_OPTIONS} different options, separated by commas.`)],
        flags: MessageFlags.Ephemeral,
      });
    }
    const id = store.createPoll(question, options, interaction.user.id);
    await interaction.reply(pollMessage(store, id));
  },

  async handleButton(interaction, { store }) {
    const [, action, rawId, rawOption] = interaction.customId.split(":");
    const pollId = Number(rawId);
    const poll = store.getPoll(pollId);
    if (!poll) return interaction.reply({ content: "This poll no longer exists.", flags: MessageFlags.Ephemeral });

    if (action === "close") {
      const canManage = interaction.memberPermissions?.has("ManageMessages") ?? false;
      if (interaction.user.id !== poll.authorId && !canManage) {
        return interaction.reply({ content: "Only the poll creator can close it.", flags: MessageFlags.Ephemeral });
      }
      store.closePoll(pollId);
      return interaction.update(pollMessage(store, pollId));
    }

    if (poll.closed) return interaction.reply({ content: "This poll is closed.", flags: MessageFlags.Ephemeral });
    store.vote(pollId, interaction.user.id, Number(rawOption));
    await interaction.update(pollMessage(store, pollId));
  },
} satisfies Command;
