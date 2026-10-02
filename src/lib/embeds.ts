import { EmbedBuilder } from "discord.js";

export const COLORS = { brand: 0x5865f2, success: 0x57f287, warn: 0xfee75c, danger: 0xed4245 } as const;

export const embed = (color: number = COLORS.brand) => new EmbedBuilder().setColor(color);

export const errorEmbed = (message: string) => embed(COLORS.danger).setDescription(`❌ ${message}`);
export const successEmbed = (message: string) => embed(COLORS.success).setDescription(`✅ ${message}`);
