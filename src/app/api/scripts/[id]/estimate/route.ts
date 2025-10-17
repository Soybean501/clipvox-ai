import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth-helpers';
import connectDB from '@/lib/db';
import { HttpError, toErrorResponse } from '@/lib/errors';
import Script from '@/models/Script';
import { countWords, targetWords } from '@/lib/utils/wpm';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    await connectDB();
    const script = await Script.findOne({ _id: params.id, ownerId: user.id });
    if (!script) {
      throw new HttpError(404, 'Script not found');
    }

    const targetWordCount = targetWords(script.lengthMinutes, script.tone, script.style);
    const actualWordCount = countWords(script.content);
    script.targetWordCount = targetWordCount;
    script.actualWordCount = actualWordCount;
    script.updatedAt = new Date();
    await script.save();

    return NextResponse.json({
      targetWordCount,
      actualWordCount,
      delta: actualWordCount - targetWordCount
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
