import { db } from "./db";
import {
  settings, summaries, logs,
  type Settings, type InsertSettings, type UpdateSettingsRequest,
  type Summary, type InsertSummary,
  type Log, type InsertLog
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getSettings(): Promise<Settings | undefined>;
  updateSettings(settings: UpdateSettingsRequest): Promise<Settings>;
  
  getSummaries(): Promise<Summary[]>;
  createSummary(summary: InsertSummary): Promise<Summary>;
  
  getLogs(): Promise<Log[]>;
  createLog(log: InsertLog): Promise<Log>;
}

export class DatabaseStorage implements IStorage {
  async getSettings(): Promise<Settings | undefined> {
    const [setting] = await db.select().from(settings).limit(1);
    return setting;
  }

  async updateSettings(update: UpdateSettingsRequest): Promise<Settings> {
    const [existing] = await db.select().from(settings).limit(1);
    if (existing) {
      const [updated] = await db.update(settings)
        .set(update)
        .where(eq(settings.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create with defaults if missing
      const [created] = await db.insert(settings)
        .values({
          watchChannelId: update.watchChannelId || "",
          summaryChannelId: update.summaryChannelId || "",
          isActive: update.isActive ?? false,
          summaryTimes: update.summaryTimes || ["20:00"],
          aiProvider: update.aiProvider || "openai",
          aiModel: update.aiModel || "gpt-4o",
        })
        .returning();
      return created;
    }
  }

  async getSummaries(): Promise<Summary[]> {
    return await db.select().from(summaries).orderBy(desc(summaries.date));
  }

  async createSummary(summary: InsertSummary): Promise<Summary> {
    const [created] = await db.insert(summaries).values(summary).returning();
    return created;
  }

  async getLogs(): Promise<Log[]> {
    return await db.select().from(logs).orderBy(desc(logs.timestamp)).limit(100);
  }

  async createLog(log: InsertLog): Promise<Log> {
    const [created] = await db.insert(logs).values(log).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
