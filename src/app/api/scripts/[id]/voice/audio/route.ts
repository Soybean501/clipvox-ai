import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth-helpers';
import connectDB from '@/lib/db';
import { HttpError, toErrorResponse } from '@/lib/errors';
import Script from '@/models/Script';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    await connectDB();
    const script = await Script.findOne({ _id: params.id, ownerId: user.id }).select({
      'voice.audioData': 1,
      'voice.audioFormat': 1
    });

    if (!script?.voice?.audioData) {
      throw new HttpError(404, 'No audio available for this script');
    }

    const buffer = Buffer.from(script.voice.audioData);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': script.voice.audioFormat ?? 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
