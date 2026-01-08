import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  watchChannelId: text("watch_channel_id").notNull(),
  summaryChannelId: text("summary_channel_id").notNull(),
  isActive: boolean("is_active").default(false).notNull(),
  lastRunAt: timestamp("last_run_at"),
  summaryTimes: text("summary_times").array().default(["20:00"]).notNull(),
  aiProvider: text("ai_provider").default("openai").notNull(),
  aiModel: text("ai_model").default("gpt-4o").notNull(),
  xBearerToken: text("x_bearer_token"),
  twitterApiIoKey: text("twitter_api_io_key"),
});

export const summaries = pgTable("summaries", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  status: text("status").notNull(), // 'success', 'failed'
});

export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  level: text("level").notNull(), // 'info', 'error', 'warn'
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const autopostTargets = pgTable("autopost_targets", {
  id: serial("id").primaryKey(),
  platform: text("platform").notNull(), // 'twitter' or 'truthsocial'
  handle: text("handle").notNull(), // username/handle to monitor
  displayName: text("display_name").notNull(), // friendly name for display
  intervalMinutes: integer("interval_minutes").default(15).notNull(),
  discordChannelId: text("discord_channel_id").notNull(),
  announcementTemplate: text("announcement_template").default("New post from {handle}!").notNull(),
  includeEmbed: boolean("include_embed").default(true).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastPostId: text("last_post_id"), // track last seen post to avoid duplicates
  lastCheckedAt: timestamp("last_checked_at"),
});

// API usage tracking for cost monitoring
export const apiUsage = pgTable("api_usage", {
  id: serial("id").primaryKey(),
  service: text("service").notNull(), // 'twitterapiio', 'openai', etc.
  callCount: integer("call_count").default(0).notNull(),
  month: text("month").notNull(), // Format: '2026-01' for easy grouping
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true, lastRunAt: true }).extend({
  summaryTimes: z.array(z.string()).optional(),
  aiProvider: z.string().optional(),
  aiModel: z.string().optional(),
  xBearerToken: z.string().nullable().optional(),
  twitterApiIoKey: z.string().nullable().optional(),
});
export const insertSummarySchema = createInsertSchema(summaries).omit({ id: true, date: true });
export const insertLogSchema = createInsertSchema(logs).omit({ id: true, timestamp: true });
export const insertAutopostTargetSchema = createInsertSchema(autopostTargets).omit({ 
  id: true, 
  lastPostId: true, 
  lastCheckedAt: true 
});

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Summary = typeof summaries.$inferSelect;
export type InsertSummary = z.infer<typeof insertSummarySchema>;
export type Log = typeof logs.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;
export type AutopostTarget = typeof autopostTargets.$inferSelect;
export type InsertAutopostTarget = z.infer<typeof insertAutopostTargetSchema>;
export type ApiUsage = typeof apiUsage.$inferSelect;

export type CreateSettingsRequest = InsertSettings;
export type UpdateSettingsRequest = Partial<InsertSettings>;

export * from "./models/chat";

