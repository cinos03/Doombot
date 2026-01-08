import OpenAI from "openai";

// The integration automatically sets these env vars
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function generateSummary(messages: { author: string, content: string, timestamp: number }[]): Promise<string> {
  if (messages.length === 0) {
    return "No messages found to summarize for today.";
  }

  // Format messages for the prompt
  const formattedMessages = messages
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(m => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.author}: ${m.content}`)
    .join("\n");

  const prompt = `
    You are a helpful assistant that summarizes Discord chat logs.
    Your goal is to provide a concise summary of the day's events based ONLY on news, politics, and significant global or local events.

    STRICT FILTERING RULES:
    - DISCARD ALL general chat, moods, personal discussions, and casual banter.
    - DISCARD ALL messages about bot status, info, or internal bot discussions.
    - FOCUS ONLY on news stories, political developments, and posted news clips.
    - If a message contains an X (Twitter) link:
        1. Analyze the surrounding context/descriptions provided by users.
        2. Summarize the ACTUAL CONTENT of the linked post based on that context.
        3. PRIORITIZE posts with high view counts (e.g., a post with 2M+ views is high priority).
        4. Do NOT just say "A post by AUTHOR"; describe what the post is ABOUT.

    Messages from the last 24 hours:
    ${formattedMessages}

    Summary Format:
    - Use Discord markdown (e.g., **bold** for topics).
    - Group related news topics together.
    - Use bullet points for clarity.
    - IMPORTANT: For every X (Twitter) post summarized, you MUST include the original link at the end of that bullet point. To prevent Discord from creating a thumbnail/embed for these links, wrap them in angle brackets like this: <https://x.com/username/status/12345>.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.1", // Using the model recommended in the blueprint
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt }
      ],
    });

    return response.choices[0].message.content || "Failed to generate summary.";
  } catch (error: any) {
    console.error("OpenAI Error:", error);
    throw new Error(`Failed to generate summary: ${error.message}`);
  }
}
