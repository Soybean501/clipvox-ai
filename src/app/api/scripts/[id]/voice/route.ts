import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth-helpers';
import connectDB from '@/lib/db';
import { HttpError, toErrorResponse } from '@/lib/errors';
import { synthesizeSpeechFromScript } from '@/lib/ai/text-to-speech';
import { getVoiceById } from '@/lib/ai/voices';
import { ScriptVoiceRequestSchema } from '@/lib/zod';
import Script from '@/models/Script';

function toVoiceResponse(script: Awaited<ReturnType<typeof Script.findOne>>) {
  if (!script?.voice) {
    return null;
  }

  const audioUrl = `/api/scripts/${script._id.toString()}/voice/audio?ts=${script.voice.updatedAt?.getTime() ?? Date.now()}`;

  return {
    provider: script.voice.provider,
    voiceId: script.voice.voiceId,
    voiceName: script.voice.voiceName,
    audioFormat: script.voice.audioFormat,
    durationSeconds: script.voice.durationSeconds ?? undefined,
    createdAt: script.voice.createdAt?.toISOString(),
    updatedAt: script.voice.updatedAt?.toISOString(),
    audioUrl
  };
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    await connectDB();
    const script = await Script.findOne({ _id: params.id, ownerId: user.id }).select({
      voice: 1
    });

    if (!script?.voice) {
      throw new HttpError(404, 'No voice track found for this script');
    }

    return NextResponse.json({ voice: toVoiceResponse(script) });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const payload = await req.json();
    const parsed = ScriptVoiceRequestSchema.safeParse(payload);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.errors[0]?.message ?? 'Invalid payload');
    }

    await connectDB();
    const script = await Script.findOne({ _id: params.id, ownerId: user.id });
    if (!script) {
      throw new HttpError(404, 'Script not found');
    }

    if (!script.content?.trim()) {
      throw new HttpError(400, 'Generate a script before creating audio.');
    }

    const voiceOption = getVoiceById(parsed.data.voiceId);
    if (!voiceOption) {
      throw new HttpError(400, 'Voice is not supported.');
    }

    const hadVoice = Boolean(script.voice);

    const synthesis = await synthesizeSpeechFromScript({
      text: script.content,
      voice: voiceOption
    });

    const now = new Date();
    script.voice = {
      provider: 'openai',
      voiceId: voiceOption.id,
      voiceName: voiceOption.title,
      audioFormat: synthesis.format,
      audioData: synthesis.audio,
      durationSeconds: script.voice?.durationSeconds ?? null,
      createdAt: script.voice?.createdAt ?? now,
      updatedAt: now
    };

    script.markModified('voice');
    await script.save();

    const voice = toVoiceResponse(script);
    return NextResponse.json({ voice }, { status: hadVoice ? 200 : 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
