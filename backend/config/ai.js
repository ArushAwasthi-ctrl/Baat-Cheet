import { createGroq } from "@ai-sdk/groq";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// llama-3.3-70b-versatile: strong reasoning, free on Groq, good for chat and summarization
// Alternatives: llama-3.1-8b-instant (faster, less capable), mixtral-8x7b-32768
const defaultModel = groq("llama-3.3-70b-versatile");

export { groq, defaultModel };
export default defaultModel;
