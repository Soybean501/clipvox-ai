import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

import connectDB from '@/lib/db';
import { HttpError, toErrorResponse } from '@/lib/errors';
import { RegisterSchema } from '@/lib/zod';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      throw new HttpError(400, parsed.error.flatten().formErrors.join(', ') || 'Invalid payload');
    }

    await connectDB();
    const email = parsed.data.email.toLowerCase();
    const existing = await User.findOne({ email });
    if (existing) {
      throw new HttpError(409, 'Account already exists');
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    await User.create({
      email,
      name: parsed.data.name ?? '',
      passwordHash
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
