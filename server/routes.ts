import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { discordBot } from "./lib/discord";
import { generateSummary } from "./lib/openai";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import cron from "node-cron";

async function runSummary() {
  const settings = await storage.getSettings();
  if (!settings || !settings.watchChannelId || !settings.summaryChannelId) {
    console.log("Skipping summary: Channels not configured");
    return;
  }
  
  if (!settings.isActive) {
     console.log("Skipping summary: Bot is not active");
     return;
  }

  try {
    await storage.createLog({ level: "info", message: "Starting scheduled summary..." });

    // 1. Fetch messages
    const messages = await discordBot.fetchMessages(settings.watchChannelId);
    await storage.createLog({ level: "info", message: `Fetched ${messages.length} messages` });

    if (messages.length === 0) {
       await storage.createLog({ level: "info", message: "No messages to summarize." });
       return;
    }

    // 2. Generate Summary
    const summaryContent = await generateSummary(messages.map(m => ({
      author: m.author.username,
      content: m.content,
      timestamp: m.createdTimestamp
    })));
    await storage.createLog({ level: "info", message: "Generated summary from OpenAI" });

    // 3. Send to Discord
    await discordBot.sendMessage(settings.summaryChannelId, `**Daily Summary**\n\n${summaryContent}`);
    
    // 4. Save to DB
    await storage.createSummary({
      content: summaryContent,
      status: "success"
    });

    await storage.updateSettings({ lastRunAt: new Date() });
  } catch (error: any) {
    await storage.createLog({ level: "error", message: `Scheduled summary failed: ${error.message}` });
    console.error("Scheduled summary failed:", error);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Register integration routes
  registerChatRoutes(app);
  registerImageRoutes(app);

  // Initialize Discord Bot
  discordBot.start();

  // Schedule daily summary at 8 PM (20:00)
  cron.schedule("0 20 * * *", () => {
    runSummary();
  });

  // Settings API
  app.get(api.settings.get.path, async (req, res) => {
    const settings = await storage.getSettings();
    if (!settings) {
      return res.status(404).json({ message: "Settings not configured" });
    }
    res.json(settings);
  });

  app.post(api.settings.update.path, async (req, res) => {
    try {
      const input = api.settings.update.input.parse(req.body);
      const updated = await storage.updateSettings(input);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Logs API
  app.get(api.logs.list.path, async (req, res) => {
    const logs = await storage.getLogs();
    res.json(logs);
  });

  // Summaries API
  app.get(api.summaries.list.path, async (req, res) => {
    const summaries = await storage.getSummaries();
    res.json(summaries);
  });

  // Trigger Summary
  app.post(api.settings.trigger.path, async (req, res) => {
    try {
      await runSummary();
      res.json({ message: "Summary process triggered!" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
