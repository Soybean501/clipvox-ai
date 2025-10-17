import { Types } from 'mongoose';
import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth-helpers';
import connectDB from '@/lib/db';
import { HttpError, toErrorResponse } from '@/lib/errors';
import { ScriptUpdateSchema } from '@/lib/zod';
import Script from '@/models/Script';
import type { ScriptDocument, ScriptLean } from '@/models/Script';
import { countWords, targetWords } from '@/lib/utils/wpm';

type ScriptLike = ScriptDocument | ScriptLean;

function serialize(script: ScriptLike) {
  const source: ScriptLean =
    'toObject' in script ? (script.toObject() as ScriptLean) : script;
  const voice = source.voice
    ? {
        provider: source.voice.provider,
        voiceId: source.voice.voiceId,
        voiceName: source.voice.voiceName,
        audioFormat: source.voice.audioFormat,
        durationSeconds: source.voice.durationSeconds ?? undefined,
        createdAt: source.voice.createdAt,
        updatedAt: source.voice.updatedAt,
        audioUrl: `/api/scripts/${source._id.toString()}/voice/audio?ts=${source.voice.updatedAt?.getTime() ?? Date.now()}`
      }
    : null;
  return {
    id: source._id.toString(),
    projectId: source.projectId.toString(),
    ownerId: source.ownerId.toString(),
    topic: source.topic,
    tone: source.tone,
    style: source.style,
    lengthMinutes: source.lengthMinutes,
    chapters: source.chapters,
    outline: source.outline,
    content: source.content,
    targetWordCount: source.targetWordCount,
    actualWordCount: source.actualWordCount,
    status: source.status,
    error: source.error,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
    voice
  };
}

function extractOutline(content: string) {
  return content
    .split('\n')
    .filter((line) => line.trim().startsWith('# '))
    .map((line) => line.replace(/^#\s*/, '').trim());
}

async function findScript(id: string, ownerId: string): Promise<ScriptDocument> {
  if (!Types.ObjectId.isValid(id)) {
    throw new HttpError(404, 'Script not found');
  }
  await connectDB();
  const script = await Script.findOne({ _id: id, ownerId });
  if (!script) {
    throw new HttpError(404, 'Script not found');
  }
  return script;
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const script = await findScript(params.id, user.id);
    return NextResponse.json(serialize(script));
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const payload = await req.json();
    const parsed = ScriptUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.flatten().formErrors.join(', ') || 'Invalid payload');
    }

    const script = await findScript(params.id, user.id);
    const updates: Record<string, unknown> = { ...parsed.data };

    const nextTone = (parsed.data.tone ?? script.tone) as string;
    const nextStyle = (parsed.data.style ?? script.style) as string;
    const nextLength = (parsed.data.lengthMinutes ?? script.lengthMinutes) as number;

    if (
      typeof parsed.data.tone !== 'undefined' ||
      typeof parsed.data.style !== 'undefined' ||
      typeof parsed.data.lengthMinutes !== 'undefined'
    ) {
      updates.targetWordCount = targetWords(nextLength, nextTone, nextStyle);
    }

    if (typeof parsed.data.content !== 'undefined') {
      updates.actualWordCount = countWords(parsed.data.content);
      updates.outline = extractOutline(parsed.data.content);
    }

    Object.assign(script, updates, { updatedAt: new Date() });
    await script.save();

    return NextResponse.json(serialize(script));
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    await findScript(params.id, user.id);
    await connectDB();
    await Script.deleteOne({ _id: params.id, ownerId: user.id });
    return NextResponse.json({ success: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
