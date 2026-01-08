import { db } from "./db";
import {
  settings, summaries, logs, autopostTargets, apiUsage,
  type Settings, type InsertSettings, type UpdateSettingsRequest,
  type Summary, type InsertSummary,
  type Log, type InsertLog,
  type AutopostTarget, type InsertAutopostTarget,
  type ApiUsage
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  getSettings(): Promise<Settings | undefined>;
  updateSettings(settings: UpdateSettingsRequest): Promise<Settings>;
  
  getSummaries(): Promise<Summary[]>;
  createSummary(summary: InsertSummary): Promise<Summary>;
  
  getLogs(): Promise<Log[]>;
  createLog(log: InsertLog): Promise<Log>;

  getAutopostTargets(): Promise<AutopostTarget[]>;
  getAutopostTarget(id: number): Promise<AutopostTarget | undefined>;
  createAutopostTarget(target: InsertAutopostTarget): Promise<AutopostTarget>;
  updateAutopostTarget(id: number, target: Partial<InsertAutopostTarget>): Promise<AutopostTarget>;
  deleteAutopostTarget(id: number): Promise<void>;
  updateAutopostLastChecked(id: number, lastPostId: string | null): Promise<void>;

  // API usage tracking
  incrementApiUsage(service: string, count?: number): Promise<void>;
  getApiUsage(): Promise<ApiUsage[]>;
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

  async getAutopostTargets(): Promise<AutopostTarget[]> {
    return await db.select().from(autopostTargets).orderBy(desc(autopostTargets.id));
  }

  async getAutopostTarget(id: number): Promise<AutopostTarget | undefined> {
    const [target] = await db.select().from(autopostTargets).where(eq(autopostTargets.id, id));
    return target;
  }

  async createAutopostTarget(target: InsertAutopostTarget): Promise<AutopostTarget> {
    const [created] = await db.insert(autopostTargets).values(target).returning();
    return created;
  }

  async updateAutopostTarget(id: number, target: Partial<InsertAutopostTarget>): Promise<AutopostTarget> {
    const [updated] = await db.update(autopostTargets)
      .set(target)
      .where(eq(autopostTargets.id, id))
      .returning();
    return updated;
  }

  async deleteAutopostTarget(id: number): Promise<void> {
    await db.delete(autopostTargets).where(eq(autopostTargets.id, id));
  }

  async updateAutopostLastChecked(id: number, lastPostId: string | null): Promise<void> {
    await db.update(autopostTargets)
      .set({ 
        lastPostId: lastPostId,
        lastCheckedAt: new Date()
      })
      .where(eq(autopostTargets.id, id));
  }

  async incrementApiUsage(service: string, count: number = 1): Promise<void> {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const [existing] = await db.select()
      .from(apiUsage)
      .where(and(eq(apiUsage.service, service), eq(apiUsage.month, month)));
    
    if (existing) {
      await db.update(apiUsage)
        .set({ 
          callCount: existing.callCount + count,
          lastUpdated: now
        })
        .where(eq(apiUsage.id, existing.id));
    } else {
      await db.insert(apiUsage).values({
        service,
        callCount: count,
        month,
        lastUpdated: now
      });
    }
  }

  async getApiUsage(): Promise<ApiUsage[]> {
    return await db.select().from(apiUsage).orderBy(desc(apiUsage.month));
  }
}

export const storage = new DatabaseStorage();
