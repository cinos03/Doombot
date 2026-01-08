import type { AutopostTarget } from "@shared/schema";
import { storage } from "../storage";

export interface SocialPost {
  id: string;
  url: string;
  text: string;
  authorHandle: string;
  imageUrl?: string;
  timestamp: Date;
}

export interface SocialFetcher {
  fetchLatest(target: AutopostTarget, bearerToken?: string | null): Promise<SocialPost | null>;
}

class TwitterApiIoFetcher implements SocialFetcher {
  async fetchLatest(target: AutopostTarget, apiKey?: string | null): Promise<SocialPost | null> {
    if (!apiKey) return null;
    
    const handle = target.handle.replace("@", "");
    
    try {
      const response = await fetch(
        `https://api.twitterapi.io/twitter/user/last_tweets?userName=${handle}`,
        {
          headers: {
            "X-API-Key": apiKey,
          },
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`TwitterAPI.io fetch failed for @${handle}: ${response.status} - ${errorText}`);
        return null;
      }
      
      // Track API usage (1 API call made)
      await storage.incrementApiUsage("twitterapiio", 1).catch(err => 
        console.error("Failed to track API usage:", err)
      );
      
      const responseData = await response.json();
      
      // TwitterAPI.io returns { status, code, msg, data: { pin_tweet, tweets }, has_next_page, next_cursor }
      const tweets = responseData.data?.tweets;
      const pinnedTweet = responseData.data?.pin_tweet;
      const pinnedTweetId = pinnedTweet?.id;
      
      if (!tweets || tweets.length === 0) {
        console.log(`TwitterAPI.io: No tweets found for @${handle}`);
        return null;
      }
      
      console.log(`TwitterAPI.io: Got ${tweets.length} tweets for @${handle}, pinned ID: ${pinnedTweetId || 'none'}`);
      
      // Find the newest tweet that isn't already posted
      // Skip pinned tweets and tweets we've already processed
      const lastPostId = target.lastPostId;
      let newestTweet = null;
      
      for (const tweet of tweets) {
        // Skip the pinned tweet (it stays at top but isn't chronologically newest)
        if (pinnedTweetId && tweet.id === pinnedTweetId) {
          console.log(`TwitterAPI.io: Skipping pinned tweet ${tweet.id}`);
          continue;
        }
        
        // Skip if this is the exact same as lastPostId (already posted)
        if (tweet.id === lastPostId) {
          continue;
        }
        
        // If we have a lastPostId, only return tweets that are newer (higher ID)
        // Twitter IDs are chronological - higher ID = newer tweet
        if (lastPostId && BigInt(tweet.id) <= BigInt(lastPostId)) {
          continue;
        }
        
        // This tweet is newer than what we've posted - use it
        newestTweet = tweet;
        break;
      }
      
      // If no new tweets found and no lastPostId, return the most recent non-pinned tweet
      if (!newestTweet && !lastPostId) {
        for (const tweet of tweets) {
          if (!pinnedTweetId || tweet.id !== pinnedTweetId) {
            newestTweet = tweet;
            break;
          }
        }
      }
      
      if (!newestTweet) {
        console.log(`TwitterAPI.io: No new tweets for @${handle} (lastPostId: ${lastPostId})`);
        return null;
      }
      
      console.log(`TwitterAPI.io: Found tweet ${newestTweet.id} for @${handle}`);
      
      return {
        id: newestTweet.id,
        url: newestTweet.url || `https://x.com/${handle}/status/${newestTweet.id}`,
        text: newestTweet.text || "",
        authorHandle: handle,
        timestamp: newestTweet.createdAt ? new Date(newestTweet.createdAt) : new Date(),
      };
    } catch (error) {
      console.error(`Error fetching TwitterAPI.io for @${handle}:`, error);
      return null;
    }
  }
}

class XApiFetcher implements SocialFetcher {
  async fetchLatest(target: AutopostTarget, bearerToken?: string | null): Promise<SocialPost | null> {
    if (!bearerToken) return null;
    
    const handle = target.handle.replace("@", "");
    
    try {
      const userResponse = await fetch(
        `https://api.x.com/2/users/by/username/${handle}`,
        {
          headers: {
            "Authorization": `Bearer ${bearerToken}`,
            "User-Agent": "DiscordBot/1.0",
          },
        }
      );
      
      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error(`X API user lookup failed for @${handle}: ${userResponse.status} - ${errorText}`);
        return null;
      }
      
      // Track API usage for user lookup
      await storage.incrementApiUsage("xapi", 1).catch(err => 
        console.error("Failed to track API usage:", err)
      );
      
      const userData = await userResponse.json();
      const userId = userData.data?.id;
      
      if (!userId) {
        console.error(`X API: No user ID found for @${handle}`);
        return null;
      }
      
      const tweetsResponse = await fetch(
        `https://api.x.com/2/users/${userId}/tweets?max_results=5&tweet.fields=created_at,text&exclude=retweets,replies`,
        {
          headers: {
            "Authorization": `Bearer ${bearerToken}`,
            "User-Agent": "DiscordBot/1.0",
          },
        }
      );
      
      if (!tweetsResponse.ok) {
        const errorText = await tweetsResponse.text();
        console.error(`X API tweets fetch failed: ${tweetsResponse.status} - ${errorText}`);
        return null;
      }
      
      // Track API usage for tweets fetch
      await storage.incrementApiUsage("xapi", 1).catch(err => 
        console.error("Failed to track API usage:", err)
      );
      
      const tweetsData = await tweetsResponse.json();
      
      if (!tweetsData.data || tweetsData.data.length === 0) {
        return null;
      }
      
      const tweet = tweetsData.data[0];
      
      return {
        id: tweet.id,
        url: `https://x.com/${handle}/status/${tweet.id}`,
        text: tweet.text || "",
        authorHandle: handle,
        timestamp: tweet.created_at ? new Date(tweet.created_at) : new Date(),
      };
    } catch (error) {
      console.error(`Error fetching X API for @${handle}:`, error);
      return null;
    }
  }
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
    "xcancel.com",
    "nitter.poast.org",
    "nitter.privacyredirect.com",
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

const twitterApiIoFetcher = new TwitterApiIoFetcher();
const xApiFetcher = new XApiFetcher();
const rssBridgeFetcher = new RSSBridgeFetcher();
const nitterFetcher = new NitterFetcher();
const truthSocialFetcher = new TruthSocialFetcher();

export interface FetchOptions {
  xBearerToken?: string | null;
  twitterApiIoKey?: string | null;
}

export async function fetchLatestPost(target: AutopostTarget, options: FetchOptions = {}): Promise<SocialPost | null> {
  const { xBearerToken, twitterApiIoKey } = options;
  
  if (target.platform === "twitter" || target.platform === "x") {
    // Priority 1: TwitterAPI.io (most reliable paid option)
    if (twitterApiIoKey) {
      const post = await twitterApiIoFetcher.fetchLatest(target, twitterApiIoKey);
      if (post) {
        console.log(`Successfully fetched tweet via TwitterAPI.io for @${target.handle}`);
        return post;
      }
      console.log(`TwitterAPI.io fetch failed for @${target.handle}, trying alternatives`);
    }
    
    // Priority 2: Official X API (if configured)
    if (xBearerToken) {
      const post = await xApiFetcher.fetchLatest(target, xBearerToken);
      if (post) {
        console.log(`Successfully fetched tweet via X API for @${target.handle}`);
        return post;
      }
      console.log(`X API fetch failed for @${target.handle}, trying free alternatives`);
    }
    
    // Priority 3: Free alternatives (Nitter, RSSHub)
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
