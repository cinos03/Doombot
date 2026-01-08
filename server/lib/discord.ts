import { Client, GatewayIntentBits, TextChannel, Message } from "discord.js";
import { storage } from "../storage";

export class DiscordBot {
  private client: Client;
  private isReady: boolean = false;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.client.on("ready", () => {
      this.isReady = true;
      storage.createLog({ level: "info", message: `Discord bot logged in as ${this.client.user?.tag}` });
      console.log(`Logged in as ${this.client.user?.tag}!`);
      
      // Log all guilds the bot is in to help debug membership issues
      console.log("Bot is currently in these servers:");
      this.client.guilds.cache.forEach(guild => {
        console.log(`- ${guild.name} (ID: ${guild.id})`);
      });
    });

    this.client.on("error", (error) => {
      storage.createLog({ level: "error", message: `Discord error: ${error.message}` });
      console.error("Discord error:", error);
    });
  }

  async start() {
    if (!process.env.DISCORD_TOKEN) {
      await storage.createLog({ level: "warn", message: "DISCORD_TOKEN not found in environment variables." });
      console.warn("DISCORD_TOKEN not found.");
      return;
    }
    try {
      await this.client.login(process.env.DISCORD_TOKEN);
    } catch (error: any) {
      await storage.createLog({ level: "error", message: `Failed to login to Discord: ${error.message}` });
      console.error("Failed to login to Discord:", error);
    }
  }

  async fetchMessages(channelId: string, limit: number = 100): Promise<Message[]> {
    if (!this.isReady) throw new Error("Bot is not ready");
    
    try {
      const channel = await this.client.channels.fetch(channelId, { force: true });
      if (!channel || !(channel instanceof TextChannel)) {
        throw new Error(`Channel ${channelId} not found or is not a text channel`);
      }

      const messages = await channel.messages.fetch({ limit });
      // Filter out messages from the last 24 hours
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      return Array.from(messages.values()).filter(m => m.createdTimestamp > oneDayAgo && !m.author.bot);
    } catch (error: any) {
      await storage.createLog({ level: "error", message: `Error fetching messages: ${error.message}` });
      throw error;
    }
  }

  async sendMessage(channelId: string, content: string) {
    if (!this.isReady) throw new Error("Bot is not ready");

    try {
      const channel = await this.client.channels.fetch(channelId, { force: true });
      if (!channel || !(channel instanceof TextChannel)) {
        throw new Error(`Channel ${channelId} not found or is not a text channel`);
      }

      // Smart message splitting to avoid breaking links or markdown
      const MAX_LENGTH = 1900;
      const chunks: string[] = [];
      let currentChunk = "";

      const lines = content.split("\n");
      for (const line of lines) {
        if (currentChunk.length + line.length + 1 > MAX_LENGTH) {
          if (currentChunk) {
            chunks.push(currentChunk.trim());
            currentChunk = "";
          }
          
          // If a single line is too long, split it carefully
          if (line.length > MAX_LENGTH) {
            let remainingLine = line;
            while (remainingLine.length > 0) {
              chunks.push(remainingLine.slice(0, MAX_LENGTH));
              remainingLine = remainingLine.slice(MAX_LENGTH);
            }
          } else {
            currentChunk = line;
          }
        } else {
          currentChunk += (currentChunk ? "\n" : "") + line;
        }
      }
      
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }

      for (const chunk of chunks) {
        await channel.send(chunk);
      }
      
      await storage.createLog({ level: "info", message: `Sent summary to channel ${channelId}` });
    } catch (error: any) {
      await storage.createLog({ level: "error", message: `Error sending message: ${error.message}` });
      throw error;
    }
  }
}

export const discordBot = new DiscordBot();
