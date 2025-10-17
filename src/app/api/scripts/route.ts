import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth-helpers';
import connectDB from '@/lib/db';
import { HttpError, toErrorResponse } from '@/lib/errors';
import { rateLimit } from '@/lib/utils/rate-limit';
import { targetWords } from '@/lib/utils/wpm';
import { ScriptCreateSchema } from '@/lib/zod';
import { generateScript } from '@/lib/ai/scriptPlanner';
import Project from '@/models/Project';
import Script from '@/models/Script';

const RATE_LIMIT = { limit: 5, windowMs: 60_000 };

function serializeScript(script: any) {
  return {
    id: script._id.toString(),
    projectId: script.projectId.toString(),
    ownerId: script.ownerId.toString(),
    topic: script.topic,
    tone: script.tone,
    style: script.style,
    lengthMinutes: script.lengthMinutes,
    chapters: script.chapters,
    outline: script.outline,
    content: script.content,
    targetWordCount: script.targetWordCount,
    actualWordCount: script.actualWordCount,
    status: script.status,
    error: script.error,
    createdAt: script.createdAt,
    updatedAt: script.updatedAt
  };
}

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');

    if (!projectId) {
      throw new HttpError(400, 'projectId is required');
    }

    await connectDB();
    const scripts = await Script.find({ projectId, ownerId: user.id })
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json(scripts.map(serializeScript));
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const data = await req.json();
    const parsed = ScriptCreateSchema.safeParse(data);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.flatten().formErrors.join(', ') || 'Invalid payload');
    }

    const { projectId, topic, tone, style, lengthMinutes, chapters } = parsed.data;

    const limiter = rateLimit(`scripts:${user.id}`, RATE_LIMIT.limit, RATE_LIMIT.windowMs);
    if (!limiter.allowed) {
      throw new HttpError(429, 'Too many requests. Please wait a moment before trying again.');
    }

    await connectDB();
    const project = await Project.findOne({ _id: projectId, ownerId: user.id });
    if (!project) {
      throw new HttpError(404, 'Project not found');
    }

    const targetWordCount = targetWords(lengthMinutes, tone, style);
    const script = await Script.create({
      ownerId: user.id,
      projectId,
      topic,
      tone,
      style: style ?? '',
      lengthMinutes,
      chapters,
      targetWordCount,
      status: 'generating'
    });

    try {
      const result = await generateScript({ topic, tone, style, chapters, targetWordCount });
      script.content = result.content;
      script.outline = result.outline;
      script.actualWordCount = result.actualWordCount;
      script.status = 'ready';
      script.error = '';
      await script.save();
    } catch (generationError) {
      script.status = 'error';
      script.error = generationError instanceof Error ? generationError.message : 'Generation failed';
      await script.save();
      throw generationError;
    }

    return NextResponse.json(serializeScript(script), { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
