import dotenv from "dotenv";
import { Worker } from "bullmq";
import Redis from "ioredis";
import { streamText, generateText } from "ai";
import { defaultModel } from "../config/ai.js";
import Message from "../models/Messages.js";
import { redisClient } from "../redis/redisClient.js";
import { MESSAGE_PARTICIPANT_PROJECTION } from "../constants/projections.js";

dotenv.config();

// IO instance — set after socket initialization via setIO()
let io = null;
export const setIO = (ioInstance) => {
  io = ioInstance;
};

const getRedisConnection = () => {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return undefined;
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
};

// ===================== HELPERS =====================

function emitToUser(userId, event, data) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

function emitToChat(chatId, event, data) {
  if (io) {
    io.to(`chat:${chatId}`).emit(event, data);
  }
}

// ===================== SUMMARY JOB =====================

async function handleSummaryJob(job) {
  const { chatId, userId, messageIds, cacheKey } = job.data;

  // Fetch unread messages
  const messages = await Message.find({ _id: { $in: messageIds } })
    .sort({ createdAt: 1 })
    .populate("sender", "username")
    .lean();

  if (messages.length < 5) {
    emitToUser(userId, "ai:summary:complete", {
      chatId,
      summary: "Only a few messages to catch up on. Read them directly!",
      tooFew: true,
    });
    return;
  }

  // Build conversation text
  const conversationText = messages
    .map((m) => `${m.sender?.username || "Unknown"}: ${m.content || "[attachment]"}`)
    .join("\n");

  let fullText = "";

  // Handle very long conversations (>100 messages) with hierarchical summarization
  if (messages.length > 100) {
    const lines = conversationText.split("\n");
    const chunkSize = 50;
    const chunkSummaries = [];

    for (let i = 0; i < lines.length; i += chunkSize) {
      const chunk = lines.slice(i, i + chunkSize).join("\n");
      const { text } = await generateText({
        model: defaultModel,
        system: "You are a chat summarizer. Be concise and factual. Use plain text only.",
        prompt: `Summarize this chat excerpt in 2-3 sentences. Focus on what was discussed and any decisions or questions:\n\n${chunk}`,
      });
      chunkSummaries.push(text);
    }

    // Final summary of summaries — this one we stream
    const combinedText = chunkSummaries.join("\n---\n");
    fullText = await streamSummary(chatId, userId, combinedText);
  } else {
    fullText = await streamSummary(chatId, userId, conversationText);
  }

  // Cache the final summary in Redis
  if (redisClient && cacheKey) {
    const ttl = parseInt(process.env.AI_CACHE_TTL || "1800");
    await redisClient.setex(cacheKey, ttl, fullText);
  }

  // Emit completion
  emitToUser(userId, "ai:summary:complete", { chatId, summary: fullText });
}

async function streamSummary(chatId, userId, conversationText) {
  const result = streamText({
    model: defaultModel,
    system: `You are a chat summarizer for the app "Baat Cheet".
Summarize the conversation concisely so the user can catch up quickly.

Rules:
- Use 3-5 bullet points
- Focus on: key topics discussed, decisions made, questions asked, and action items
- Use plain text, no markdown headers
- Be factual — do not add information that isn't in the conversation
- If the conversation is casual with no key points, say so briefly`,
    prompt: `Summarize this conversation:\n\n${conversationText}`,
  });

  let fullText = "";

  try {
    for await (const chunk of result.textStream) {
      fullText += chunk;
      emitToUser(userId, "ai:summary:chunk", { chatId, chunk });
    }
  } catch (streamErr) {
    console.error("[AI Summary] Streaming error:", streamErr.message);
  }

  // Fallback: if streaming was empty, await full text
  if (!fullText.trim()) {
    console.warn("[AI Summary] Stream was empty, falling back to result.text");
    try {
      fullText = await result.text;
    } catch (fallbackErr) {
      console.error("[AI Summary] Fallback also failed:", fallbackErr.message);
    }
  }

  return fullText;
}

// ===================== AI CHAT JOB =====================

async function handleAiChatJob(job) {
  const { chatId, userId, userMessage, contextMessages, aiUserId } = job.data;

  // Build context
  const contextText = contextMessages
    .map((m) => `${m.senderName}: ${m.content || "[attachment]"}`)
    .join("\n");

  console.log("[AI Chat] Starting job for chat:", chatId, "user:", userId);
  console.log("[AI Chat] userMessage:", userMessage);
  console.log("[AI Chat] context length:", contextMessages.length);

  // Start typing indicator
  emitToChat(chatId, "ai:typing:start", { chatId });

  const result = streamText({
    model: defaultModel,
    system: `You are a helpful AI assistant embedded in a chat app called "Baat Cheet".
Users mention @ai to ask you questions.

Rules:
- Answer the user's question directly and accurately
- Use the conversation context only if it helps answer the question
- Do not repeat or summarize the conversation unless asked
- Do not roleplay as other users or pretend to be a chat participant
- Keep responses concise (under 150 words) unless more detail is needed
- Use plain text. Avoid markdown headers. Light formatting (bullet points, bold) is okay
- If the question is unclear, ask for clarification instead of guessing
- Do not make up information. Say "I'm not sure" if you don't know`,
    messages: [
      {
        role: "user",
        content: `Here is the recent chat conversation for context:\n\n${contextText}\n\n---\n\nThe user's question is: ${userMessage}`,
      },
    ],
  });

  let fullText = "";

  try {
    for await (const chunk of result.textStream) {
      fullText += chunk;
      emitToChat(chatId, "ai:chat:chunk", { chatId, chunk, fullText });
    }
  } catch (streamErr) {
    console.error("[AI Chat] Streaming error:", streamErr.message);
  }

  console.log("[AI Chat] Stream done. fullText length:", fullText.length);

  // Fallback: if streaming produced empty text, await the full text Promise
  if (!fullText.trim()) {
    console.warn("[AI Chat] Stream was empty, falling back to result.text");
    try {
      fullText = await result.text;
      console.log("[AI Chat] Fallback text length:", fullText.length);
    } catch (fallbackErr) {
      console.error("[AI Chat] Fallback also failed:", fallbackErr.message);
    }
  }

  // Stop typing
  emitToChat(chatId, "ai:typing:stop", { chatId });

  // Don't save empty AI messages
  if (!fullText.trim()) {
    console.error("[AI Chat] No text generated — skipping message save");
    emitToChat(chatId, "ai:chat:error", {
      chatId,
      error: "AI could not generate a response. Please try again.",
    });
    return;
  }

  // Save AI response as a regular message
  const aiMessage = await Message.create({
    chat: chatId,
    sender: aiUserId,
    content: fullText.trim(),
    type: "text",
  });

  const populatedMessage = await Message.findById(aiMessage._id)
    .populate("sender", MESSAGE_PARTICIPANT_PROJECTION)
    .lean();

  // Emit as standard message:new (existing Redux handling picks it up)
  emitToChat(chatId, "message:new", {
    chatId,
    message: populatedMessage,
  });

  emitToChat(chatId, "ai:chat:complete", {
    chatId,
    message: populatedMessage,
  });

  return { messageId: aiMessage._id };
}

// ===================== WORKER SETUP =====================

const worker = new Worker(
  "aiTasks",
  async (job) => {
    console.log(`Processing AI job: ${job.name} (${job.id})`);
    switch (job.name) {
      case "summary":
        await handleSummaryJob(job);
        break;
      case "aiChat":
        await handleAiChatJob(job);
        break;
      default:
        console.warn(`Unknown AI job type: ${job.name}`);
    }
  },
  {
    connection: getRedisConnection(),
    concurrency: 3,
  },
);

worker.on("completed", (job) => {
  console.log(`AI Job ${job.id} (${job.name}) completed`);
});

worker.on("failed", (job, err) => {
  console.error(`AI Job ${job?.id} (${job?.name}) failed:`, err.message);
  if (job?.data?.userId) {
    const event = job.name === "summary" ? "ai:summary:error" : "ai:chat:error";
    emitToUser(job.data.userId, event, {
      chatId: job.data.chatId,
      error: "AI service temporarily unavailable. Please try again.",
    });
  }
});

export default worker;
