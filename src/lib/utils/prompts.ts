export function buildScriptSystemPrompt() {
  return `You are ClipVox's ScriptPlanner. Produce accurate, well-structured long-form scripts with clear chapter headings.
- Respect targetWordCount within ±10%.
- Tone, style, and topic must be followed strictly.
- Write in fluent, natural English for spoken delivery.`;
}

export function buildScriptUserPrompt(opts: {
  topic: string;
  tone: string;
  style?: string;
  chapters: number;
  targetWordCount: number;
}) {
  const { topic, tone, style, chapters, targetWordCount } = opts;
  return `Topic: ${topic}
Tone: ${tone}
Style: ${style || 'default'}
Chapters: ${chapters}
TargetWordCount: ${targetWordCount}

Output requirements:
- Start with a one-paragraph intro (50–120 words).
- Then ${chapters} chapters, each with a Markdown H1 heading "Chapter N: <Title>" and 2–5 paragraphs of content.
- End with a brief closing paragraph suited to the tone.
- Avoid filler, avoid lists unless essential, write for spoken delivery.`;
}
