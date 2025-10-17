import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth-helpers';
import connectDB from '@/lib/db';
import { HttpError, toErrorResponse } from '@/lib/errors';
import { ProjectCreateSchema } from '@/lib/zod';
import Project from '@/models/Project';

function serializeProject(project: any) {
  return {
    id: project._id.toString(),
    title: project.title,
    description: project.description,
    tags: project.tags,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  };
}

export async function GET() {
  try {
    const user = await requireUser();
    await connectDB();
    const projects = await Project.find({ ownerId: user.id }).sort({ updatedAt: -1 }).lean();
    return NextResponse.json(projects.map(serializeProject));
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const data = await req.json();
    const parsed = ProjectCreateSchema.safeParse(data);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.flatten().formErrors.join(', ') || 'Invalid payload');
    }

    await connectDB();
    const project = await Project.create({
      ownerId: user.id,
      title: parsed.data.title,
      description: parsed.data.description ?? '',
      tags: parsed.data.tags ?? []
    });

    return NextResponse.json(serializeProject(project), { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
