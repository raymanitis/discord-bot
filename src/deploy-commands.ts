import { REST, Routes } from "discord.js";
import { commands } from "./commands/index.js";
import { loadConfig } from "./config.js";

const config = loadConfig();
const rest = new REST().setToken(config.DISCORD_TOKEN);
const body = commands.map((c) => c.data.toJSON());

if (config.GUILD_ID) {
  await rest.put(Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID), { body });
  console.log(`Registered ${body.length} commands in server ${config.GUILD_ID} (instant).`);
} else {
  await rest.put(Routes.applicationCommands(config.CLIENT_ID), { body });
  console.log(`Registered ${body.length} commands globally (can take up to an hour to show).`);
}
