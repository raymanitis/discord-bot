import { Collection } from "discord.js";
import type { Command } from "../types.js";
import clear from "./clear.js";
import help from "./help.js";
import ping from "./ping.js";
import poll from "./poll.js";
import remind from "./remind.js";
import serverinfo from "./serverinfo.js";
import settings from "./settings.js";
import userinfo from "./userinfo.js";
import warn from "./warn.js";

const all: Command[] = [help, ping, userinfo, serverinfo, poll, remind, warn, clear, settings];

export const commands = new Collection<string, Command>(all.map((c) => [c.data.name, c]));
