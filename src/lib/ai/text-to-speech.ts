import { getOpenAIClient } from './openai';
import type { VoiceOption } from './voices';

const DEFAULT_TTS_MODEL = process.env.OPENAI_TTS_MODEL ?? 'gpt-4o-mini-tts';
const DEFAULT_AUDIO_FORMAT = 'mp3';

interface SynthesisResult {
  audio: Buffer;
  format: string;
}

export async function synthesizeSpeechFromScript(params: { text: string; voice: VoiceOption }): Promise<SynthesisResult> {
  const { text, voice } = params;
  if (!text.trim()) {
    throw new Error('Script has no content to synthesize.');
  }

  const client = getOpenAIClient();
  const model = voice.model ?? DEFAULT_TTS_MODEL;

  const response = await client.audio.speech.create({
    model,
    voice: voice.voice,
    input: text,
    format: DEFAULT_AUDIO_FORMAT
  });

  const arrayBuffer = await response.arrayBuffer();
  return {
    audio: Buffer.from(arrayBuffer),
    format: `audio/${DEFAULT_AUDIO_FORMAT}`
  };
}
