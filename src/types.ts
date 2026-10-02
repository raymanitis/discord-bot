import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  Client,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";
import type { Store } from "./db.js";

export interface Context {
  client: Client;
  store: Store;
}

export interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;
  /** Seconds a user must wait between uses. */
  cooldown?: number;
  execute(interaction: ChatInputCommandInteraction, ctx: Context): Promise<unknown>;
  /** Handles buttons whose customId starts with "<command name>:". */
  handleButton?(interaction: ButtonInteraction, ctx: Context): Promise<unknown>;
}
