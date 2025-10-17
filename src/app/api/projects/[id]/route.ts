import { Types } from 'mongoose';
import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth-helpers';
import connectDB from '@/lib/db';
import { HttpError, toErrorResponse } from '@/lib/errors';
import { ProjectUpdateSchema } from '@/lib/zod';
import Project from '@/models/Project';
import Script from '@/models/Script';

function serialize(project: any) {
  return {
    id: project._id.toString(),
    title: project.title,
    description: project.description,
    tags: project.tags,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  };
}

async function findProject(id: string, ownerId: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new HttpError(404, 'Project not found');
  }
  await connectDB();
  const project = await Project.findOne({ _id: id, ownerId }).lean();
  if (!project) {
    throw new HttpError(404, 'Project not found');
  }
  return project;
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const project = await findProject(params.id, user.id);
    return NextResponse.json(serialize(project));
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const payload = await req.json();
    const parsed = ProjectUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.flatten().formErrors.join(', ') || 'Invalid payload');
    }

    await findProject(params.id, user.id);
    await connectDB();
    const project = await Project.findOneAndUpdate(
      { _id: params.id, ownerId: user.id },
      { ...parsed.data, updatedAt: new Date() },
      { new: true }
    ).lean();

    if (!project) {
      throw new HttpError(404, 'Project not found');
    }

    return NextResponse.json(serialize(project));
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    await findProject(params.id, user.id);

    await connectDB();
    await Project.deleteOne({ _id: params.id, ownerId: user.id });
    await Script.deleteMany({ projectId: params.id, ownerId: user.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
