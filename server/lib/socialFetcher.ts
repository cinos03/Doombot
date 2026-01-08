import type { AutopostTarget } from "@shared/schema";

export interface SocialPost {
  id: string;
  url: string;
  text: string;
  authorHandle: string;
  imageUrl?: string;
  timestamp: Date;
}

export interface SocialFetcher {
  fetchLatest(target: AutopostTarget): Promise<SocialPost | null>;
}

class RSSBridgeFetcher implements SocialFetcher {
  async fetchLatest(target: AutopostTarget): Promise<SocialPost | null> {
    const handle = target.handle.replace("@", "");
    
    try {
      const response = await fetch(
        `https://rsshub.app/twitter/user/${handle}`,
        {
          headers: {
            "User-Agent": "DiscordBot/1.0",
          },
        }
      );
      
      if (!response.ok) {
        console.error(`RSSHub fetch failed for @${handle}: ${response.status}`);
        return null;
      }

      const rssText = await response.text();
      
      const linkMatch = rssText.match(/<link>https?:\/\/(?:twitter\.com|x\.com)\/[^/]+\/status\/(\d+)<\/link>/);
      const titleMatch = rssText.match(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/);
      const pubDateMatch = rssText.match(/<pubDate>([^<]+)<\/pubDate>/);
      
      if (linkMatch) {
        const tweetId = linkMatch[1];
        return {
          id: tweetId,
          url: `https://x.com/${handle}/status/${tweetId}`,
          text: titleMatch?.[1]?.replace(/<[^>]*>/g, "") || "",
          authorHandle: handle,
          timestamp: pubDateMatch ? new Date(pubDateMatch[1]) : new Date(),
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching Twitter via RSSHub for @${handle}:`, error);
      return null;
    }
  }
}

class NitterFetcher implements SocialFetcher {
  private nitterInstances = [
    "nitter.privacydev.net",
    "nitter.poast.org",
    "nitter.moomoo.me",
  ];

  async fetchLatest(target: AutopostTarget): Promise<SocialPost | null> {
    const handle = target.handle.replace("@", "");
    
    for (const instance of this.nitterInstances) {
      try {
        const response = await fetch(
          `https://${instance}/${handle}/rss`,
          {
            headers: {
              "User-Agent": "DiscordBot/1.0",
            },
          }
        );
        
        if (!response.ok) continue;
        
        const rssText = await response.text();
        
        const guidMatch = rssText.match(/<guid>([^<]+)<\/guid>/);
        const linkMatch = rssText.match(/<link>https?:\/\/[^/]+\/[^/]+\/status\/(\d+)<\/link>/);
        const descMatch = rssText.match(/<description><!\[CDATA\[([^\]]+)\]\]><\/description>/);
        const pubDateMatch = rssText.match(/<pubDate>([^<]+)<\/pubDate>/);
        
        if (linkMatch) {
          const tweetId = linkMatch[1];
          return {
            id: tweetId,
            url: `https://x.com/${handle}/status/${tweetId}`,
            text: descMatch?.[1]?.replace(/<[^>]*>/g, "") || "",
            authorHandle: handle,
            timestamp: pubDateMatch ? new Date(pubDateMatch[1]) : new Date(),
          };
        }
      } catch (error) {
        console.error(`Nitter instance ${instance} failed:`, error);
        continue;
      }
    }
    
    return null;
  }
}

class TruthSocialFetcher implements SocialFetcher {
  async fetchLatest(target: AutopostTarget): Promise<SocialPost | null> {
    const handle = target.handle.replace("@", "");
    
    try {
      const lookupResponse = await fetch(
        `https://truthsocial.com/api/v1/accounts/lookup?acct=${handle}`,
        {
          headers: {
            "User-Agent": "DiscordBot/1.0",
          },
        }
      );
      
      if (!lookupResponse.ok) {
        console.error(`Truth Social account lookup failed for @${handle}: ${lookupResponse.status}`);
        return null;
      }
      
      const account = await lookupResponse.json();
      const accountId = account.id;
      
      const statusesResponse = await fetch(
        `https://truthsocial.com/api/v1/accounts/${accountId}/statuses?limit=1&exclude_replies=true`,
        {
          headers: {
            "User-Agent": "DiscordBot/1.0",
          },
        }
      );
      
      if (!statusesResponse.ok) {
        console.error(`Truth Social statuses fetch failed: ${statusesResponse.status}`);
        return null;
      }
      
      const statuses = await statusesResponse.json();
      
      if (!statuses || statuses.length === 0) {
        return null;
      }
      
      const post = statuses[0];
      
      return {
        id: post.id,
        url: post.url || `https://truthsocial.com/@${handle}/posts/${post.id}`,
        text: post.content?.replace(/<[^>]*>/g, "") || "",
        authorHandle: handle,
        imageUrl: post.media_attachments?.[0]?.url,
        timestamp: new Date(post.created_at),
      };
    } catch (error) {
      console.error(`Error fetching Truth Social for @${handle}:`, error);
      return null;
    }
  }
}

const rssBridgeFetcher = new RSSBridgeFetcher();
const nitterFetcher = new NitterFetcher();
const truthSocialFetcher = new TruthSocialFetcher();

export async function fetchLatestPost(target: AutopostTarget): Promise<SocialPost | null> {
  if (target.platform === "twitter" || target.platform === "x") {
    let post = await nitterFetcher.fetchLatest(target);
    if (!post) {
      post = await rssBridgeFetcher.fetchLatest(target);
    }
    return post;
  } else if (target.platform === "truthsocial") {
    return truthSocialFetcher.fetchLatest(target);
  }
  
  console.error(`Unknown platform: ${target.platform}`);
  return null;
}
