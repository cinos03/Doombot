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
    Here are the messages from the last 24 hours:

    ${formattedMessages}

    Please provide a concise summary of the day's events in bullet points.
    - Discard extra chatter, jokes, or irrelevant messages.
    - Focus on news, important discussions, and events.
    - Group related topics together.
    - Use Discord markdown formatting (e.g., **bold** for topics).
    - IMPORTANT: If a message contains an X (Twitter) link, and there is following context or descriptions provided by the users about that link, make sure to actually summarize the CONTENT of what was shared based on that context, rather than just saying "a post by AUTHOR".
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
