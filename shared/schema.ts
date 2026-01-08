import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
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

export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true, lastRunAt: true }).extend({
  summaryTimes: z.array(z.string()).optional(),
  aiProvider: z.string().optional(),
  aiModel: z.string().optional(),
});
export const insertSummarySchema = createInsertSchema(summaries).omit({ id: true, date: true });
export const insertLogSchema = createInsertSchema(logs).omit({ id: true, timestamp: true });

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Summary = typeof summaries.$inferSelect;
export type InsertSummary = z.infer<typeof insertSummarySchema>;
export type Log = typeof logs.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;

export type CreateSettingsRequest = InsertSettings;
export type UpdateSettingsRequest = Partial<InsertSettings>;

export * from "./models/chat";

