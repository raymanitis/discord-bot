import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export interface Warning {
  id: number;
  guildId: string;
  userId: string;
  moderatorId: string;
  reason: string;
  createdAt: number;
}

export interface Reminder {
  id: number;
  userId: string;
  channelId: string;
  message: string;
  dueAt: number;
}

export interface Poll {
  id: number;
  question: string;
  options: string[];
  authorId: string;
  closed: boolean;
}

export interface GuildSettings {
  welcomeChannelId: string | null;
  welcomeMessage: string | null;
  logChannelId: string | null;
}

const MIGRATIONS = [
  `CREATE TABLE guild_settings (
     guild_id TEXT PRIMARY KEY,
     welcome_channel_id TEXT,
     welcome_message TEXT,
     log_channel_id TEXT
   )`,
  `CREATE TABLE warnings (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     guild_id TEXT NOT NULL,
     user_id TEXT NOT NULL,
     moderator_id TEXT NOT NULL,
     reason TEXT NOT NULL,
     created_at INTEGER NOT NULL
   )`,
  `CREATE INDEX warnings_guild_user ON warnings (guild_id, user_id)`,
  `CREATE TABLE reminders (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     user_id TEXT NOT NULL,
     channel_id TEXT NOT NULL,
     message TEXT NOT NULL,
     due_at INTEGER NOT NULL
   )`,
  `CREATE TABLE polls (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     question TEXT NOT NULL,
     options TEXT NOT NULL,
     author_id TEXT NOT NULL,
     closed INTEGER NOT NULL DEFAULT 0
   )`,
  `CREATE TABLE poll_votes (
     poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
     user_id TEXT NOT NULL,
     option_index INTEGER NOT NULL,
     PRIMARY KEY (poll_id, user_id)
   )`,
];

/** Thin data layer over SQLite. Everything the bot stores goes through here. */
export class Store {
  readonly db: Database.Database;

  constructor(path: string) {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    this.db = new Database(path);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
    this.migrate();
  }

  private migrate() {
    const version = this.db.pragma("user_version", { simple: true }) as number;
    const pending = MIGRATIONS.slice(version);
    if (pending.length === 0) return;
    this.db.transaction(() => {
      for (const sql of pending) this.db.exec(sql);
      this.db.pragma(`user_version = ${MIGRATIONS.length}`);
    })();
  }

  // ---- guild settings ----

  getSettings(guildId: string): GuildSettings {
    const row = this.db
      .prepare(
        `SELECT welcome_channel_id AS welcomeChannelId, welcome_message AS welcomeMessage,
                log_channel_id AS logChannelId
         FROM guild_settings WHERE guild_id = ?`,
      )
      .get(guildId) as GuildSettings | undefined;
    return row ?? { welcomeChannelId: null, welcomeMessage: null, logChannelId: null };
  }

  updateSettings(guildId: string, patch: Partial<GuildSettings>) {
    const next = { ...this.getSettings(guildId), ...patch };
    this.db
      .prepare(
        `INSERT INTO guild_settings (guild_id, welcome_channel_id, welcome_message, log_channel_id)
         VALUES (@guildId, @welcomeChannelId, @welcomeMessage, @logChannelId)
         ON CONFLICT (guild_id) DO UPDATE SET
           welcome_channel_id = excluded.welcome_channel_id,
           welcome_message = excluded.welcome_message,
           log_channel_id = excluded.log_channel_id`,
      )
      .run({ guildId, ...next });
    return next;
  }

  // ---- warnings ----

  addWarning(w: Omit<Warning, "id" | "createdAt">, now = Date.now()): number {
    const res = this.db
      .prepare(
        `INSERT INTO warnings (guild_id, user_id, moderator_id, reason, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(w.guildId, w.userId, w.moderatorId, w.reason, now);
    return Number(res.lastInsertRowid);
  }

  listWarnings(guildId: string, userId: string): Warning[] {
    return this.db
      .prepare(
        `SELECT id, guild_id AS guildId, user_id AS userId, moderator_id AS moderatorId,
                reason, created_at AS createdAt
         FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC`,
      )
      .all(guildId, userId) as Warning[];
  }

  removeWarning(guildId: string, id: number): boolean {
    return this.db.prepare(`DELETE FROM warnings WHERE guild_id = ? AND id = ?`).run(guildId, id).changes > 0;
  }

  // ---- reminders ----

  addReminder(r: Omit<Reminder, "id">): number {
    const res = this.db
      .prepare(`INSERT INTO reminders (user_id, channel_id, message, due_at) VALUES (?, ?, ?, ?)`)
      .run(r.userId, r.channelId, r.message, r.dueAt);
    return Number(res.lastInsertRowid);
  }

  dueReminders(now = Date.now()): Reminder[] {
    return this.db
      .prepare(
        `SELECT id, user_id AS userId, channel_id AS channelId, message, due_at AS dueAt
         FROM reminders WHERE due_at <= ? ORDER BY due_at`,
      )
      .all(now) as Reminder[];
  }

  deleteReminder(id: number) {
    this.db.prepare(`DELETE FROM reminders WHERE id = ?`).run(id);
  }

  // ---- polls ----

  createPoll(question: string, options: string[], authorId: string): number {
    const res = this.db
      .prepare(`INSERT INTO polls (question, options, author_id) VALUES (?, ?, ?)`)
      .run(question, JSON.stringify(options), authorId);
    return Number(res.lastInsertRowid);
  }

  getPoll(id: number): Poll | null {
    const row = this.db
      .prepare(`SELECT id, question, options, author_id AS authorId, closed FROM polls WHERE id = ?`)
      .get(id) as { id: number; question: string; options: string; authorId: string; closed: number } | undefined;
    if (!row) return null;
    return { ...row, options: JSON.parse(row.options) as string[], closed: row.closed === 1 };
  }

  /** One vote per user; voting again changes the vote. */
  vote(pollId: number, userId: string, optionIndex: number) {
    this.db
      .prepare(
        `INSERT INTO poll_votes (poll_id, user_id, option_index) VALUES (?, ?, ?)
         ON CONFLICT (poll_id, user_id) DO UPDATE SET option_index = excluded.option_index`,
      )
      .run(pollId, userId, optionIndex);
  }

  pollVotes(pollId: number): number[] {
    return (
      this.db.prepare(`SELECT option_index AS i FROM poll_votes WHERE poll_id = ?`).all(pollId) as { i: number }[]
    ).map((r) => r.i);
  }

  closePoll(id: number) {
    this.db.prepare(`UPDATE polls SET closed = 1 WHERE id = ?`).run(id);
  }

  close() {
    this.db.close();
  }
}
