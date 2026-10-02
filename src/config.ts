import { z } from "zod";

const schema = z.object({
  DISCORD_TOKEN: z.string().min(1, "DISCORD_TOKEN is missing"),
  CLIENT_ID: z.string().min(1, "CLIENT_ID is missing"),
  GUILD_ID: z.string().optional().transform((v) => v || undefined),
  DATABASE_PATH: z.string().default("./data/bot.db"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
});

export type Config = z.infer<typeof schema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  try {
    process.loadEnvFile?.(".env");
  } catch {
    // no .env file, rely on real environment variables
  }
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid configuration:\n${problems}\nCopy .env.example to .env and fill it in.`);
  }
  return parsed.data;
}
