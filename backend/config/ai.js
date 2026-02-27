import { createGroq } from "@ai-sdk/groq";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// llama-3.1-8b-instant: fast, free tier friendly, good for summarization and chat
// Alternatives: llama-3.1-70b-versatile (slower, more capable), mixtral-8x7b-32768
const defaultModel = groq("llama-3.1-8b-instant");

export { groq, defaultModel };
export default defaultModel;
