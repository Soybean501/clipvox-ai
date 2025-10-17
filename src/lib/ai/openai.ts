import OpenAI from 'openai';

let client: OpenAI | null = null;

export function getOpenAIClient() {
  if (client) {
    return client;
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  client = new OpenAI({ apiKey });
  return client;
}
