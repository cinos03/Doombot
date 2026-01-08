import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { discordBot } from "./lib/discord";
import { generateSummary } from "./lib/openai";
import { fetchLatestPost } from "./lib/socialFetcher";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import cron, { ScheduledTask } from "node-cron";
import type { AutopostTarget } from "@shared/schema";

let scheduledTasks: ScheduledTask[] = [];
let autopostTasks: Map<number, ScheduledTask> = new Map();

async function setupScheduledTasks() {
  // Clear existing tasks
  scheduledTasks.forEach(task => task.stop());
  scheduledTasks = [];

  const settings = await storage.getSettings();
  if (!settings || !settings.summaryTimes || settings.summaryTimes.length === 0) {
    console.log("No summary times configured, using default 20:00");
    const task = cron.schedule("0 20 * * *", () => runSummary());
    scheduledTasks.push(task);
    return;
  }

  for (const time of settings.summaryTimes) {
    const [hour, minute] = time.split(":").map(Number);
    if (!isNaN(hour) && !isNaN(minute)) {
      const cronExpression = `${minute} ${hour} * * *`;
      console.log(`Scheduling summary at ${time} (cron: ${cronExpression})`);
      const task = cron.schedule(cronExpression, () => runSummary());
      scheduledTasks.push(task);
    }
  }
}

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
    const summaryContent = await generateSummary(
      messages.map(m => ({
        author: m.author.username,
        content: m.content,
        timestamp: m.createdTimestamp
      })),
      { aiProvider: settings.aiProvider, aiModel: settings.aiModel }
    );
    await storage.createLog({ level: "info", message: "Generated summary from OpenAI" });

    // 3. Send to Discord
    const today = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    await discordBot.sendMessage(settings.summaryChannelId, `**Daily Summary - ${today}**\n\n${summaryContent}`);
    
    // 4. Save to DB
    await storage.createSummary({
      content: summaryContent,
      status: "success"
    });

    // 5. Update settings (skip lastRunAt if not in schema)
    await storage.updateSettings({ isActive: settings.isActive });
  } catch (error: any) {
    await storage.createLog({ level: "error", message: `Scheduled summary failed: ${error.message}` });
    console.error("Scheduled summary failed:", error);
  }
}

async function checkAutopost(target: AutopostTarget) {
  try {
    const settings = await storage.getSettings();
    
    const post = await fetchLatestPost(target, {
      xBearerToken: settings?.xBearerToken,
      twitterApiIoKey: settings?.twitterApiIoKey,
    });
    
    if (!post) {
      console.log(`No posts found for ${target.platform}/@${target.handle}`);
      return { found: false };
    }

    if (target.lastPostId === post.id) {
      console.log(`No new posts for ${target.platform}/@${target.handle}`);
      return { found: false };
    }

    let message = target.announcementTemplate
      .replace("{handle}", target.handle)
      .replace("{platform}", target.platform)
      .replace("{displayName}", target.displayName);

    if (target.includeEmbed) {
      message += `\n${post.url}`;
    } else {
      message += `\n<${post.url}>`;
    }

    await discordBot.sendMessage(target.discordChannelId, message);
    await storage.updateAutopostLastChecked(target.id, post.id);
    await storage.createLog({ 
      level: "info", 
      message: `AutoPost: New ${target.platform} post from @${target.handle} shared to channel` 
    });

    return { found: true, postId: post.id };
  } catch (error: any) {
    await storage.createLog({ 
      level: "error", 
      message: `AutoPost failed for @${target.handle}: ${error.message}` 
    });
    console.error(`AutoPost check failed for ${target.handle}:`, error);
    return { found: false, error: error.message };
  }
}

function scheduleAutopostTarget(target: AutopostTarget) {
  if (autopostTasks.has(target.id)) {
    autopostTasks.get(target.id)?.stop();
    autopostTasks.delete(target.id);
  }

  if (!target.isActive) {
    return;
  }

  const cronExpression = `*/${target.intervalMinutes} * * * *`;
  console.log(`Scheduling autopost for @${target.handle} every ${target.intervalMinutes} min (cron: ${cronExpression})`);
  
  const task = cron.schedule(cronExpression, async () => {
    const currentTarget = await storage.getAutopostTarget(target.id);
    if (currentTarget && currentTarget.isActive) {
      await checkAutopost(currentTarget);
    }
  });

  autopostTasks.set(target.id, task);
}

async function setupAutopostTasks() {
  autopostTasks.forEach(task => task.stop());
  autopostTasks.clear();

  const targets = await storage.getAutopostTargets();
  for (const target of targets) {
    if (target.isActive) {
      scheduleAutopostTarget(target);
    }
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

  // Setup scheduled tasks based on settings
  setupScheduledTasks();

  // Setup autopost tasks
  setupAutopostTasks();

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
      
      // Reschedule tasks if summary times changed
      if (input.summaryTimes) {
        await setupScheduledTasks();
      }
      
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

  // AutoPost API
  app.get(api.autopost.list.path, async (req, res) => {
    const targets = await storage.getAutopostTargets();
    res.json(targets);
  });

  app.get("/api/autopost/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const target = await storage.getAutopostTarget(id);
    if (!target) {
      return res.status(404).json({ message: "AutoPost target not found" });
    }
    res.json(target);
  });

  app.post(api.autopost.create.path, async (req, res) => {
    try {
      const input = api.autopost.create.input.parse(req.body);
      const created = await storage.createAutopostTarget(input);
      scheduleAutopostTarget(created);
      await storage.createLog({ 
        level: "info", 
        message: `AutoPost target created: ${input.platform}/@${input.handle}` 
      });
      res.json(created);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/autopost/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getAutopostTarget(id);
      if (!existing) {
        return res.status(404).json({ message: "AutoPost target not found" });
      }
      const input = api.autopost.update.input.parse(req.body);
      const updated = await storage.updateAutopostTarget(id, input);
      scheduleAutopostTarget(updated);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/autopost/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getAutopostTarget(id);
      if (!existing) {
        return res.status(404).json({ message: "AutoPost target not found" });
      }
      
      if (autopostTasks.has(id)) {
        autopostTasks.get(id)?.stop();
        autopostTasks.delete(id);
      }
      
      await storage.deleteAutopostTarget(id);
      await storage.createLog({ 
        level: "info", 
        message: `AutoPost target deleted: ${existing.platform}/@${existing.handle}` 
      });
      res.json({ message: "AutoPost target deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/autopost/:id/check", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const target = await storage.getAutopostTarget(id);
      if (!target) {
        return res.status(404).json({ message: "AutoPost target not found" });
      }
      const result = await checkAutopost(target);
      res.json({ message: result.found ? "New post found and shared!" : "No new posts", found: result.found });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/autopost/:id/resend", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const target = await storage.getAutopostTarget(id);
      if (!target) {
        return res.status(404).json({ message: "AutoPost target not found" });
      }
      
      if (!target.lastPostId) {
        return res.status(400).json({ message: "No previous post to resend" });
      }

      const postUrl = target.platform === "truthsocial" 
        ? `https://truthsocial.com/@${target.handle}/posts/${target.lastPostId}`
        : `https://x.com/${target.handle}/status/${target.lastPostId}`;

      let message = target.announcementTemplate
        .replace("{handle}", target.handle)
        .replace("{platform}", target.platform)
        .replace("{displayName}", target.displayName);

      if (target.includeEmbed) {
        message += `\n${postUrl}`;
      } else {
        message += `\n<${postUrl}>`;
      }

      await discordBot.sendMessage(target.discordChannelId, message);
      await storage.createLog({ 
        level: "info", 
        message: `AutoPost: Resent last ${target.platform} post from @${target.handle} to channel` 
      });

      res.json({ message: "Last post resent to Discord!", success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
