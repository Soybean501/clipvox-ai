import { getOpenAIClient } from './openai';
import { buildScriptSystemPrompt, buildScriptUserPrompt } from '../utils/prompts';
import { countWords } from '../utils/wpm';

export interface GenerateScriptParams {
  topic: string;
  tone: string;
  style?: string;
  chapters: number;
  targetWordCount: number;
}

export interface GeneratedScriptResult {
  content: string;
  outline: string[];
  actualWordCount: number;
}

function extractOutline(content: string) {
  return content
    .split('\n')
    .filter((line) => line.trim().startsWith('# '))
    .map((line) => line.replace(/^#\s*/, '').trim());
}

export async function generateScript(params: GenerateScriptParams): Promise<GeneratedScriptResult> {
  const client = getOpenAIClient();
  const messages = [
    { role: 'system', content: buildScriptSystemPrompt() },
    { role: 'user', content: buildScriptUserPrompt(params) }
  ] as const;

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    messages,
    temperature: 0.7
  });

  const content = response.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('No content returned from OpenAI');
  }

  const outline = extractOutline(content);
  const actualWordCount = countWords(content);

  return { content, outline, actualWordCount };
}
