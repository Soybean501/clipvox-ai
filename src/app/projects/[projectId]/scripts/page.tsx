import { notFound, redirect } from 'next/navigation';
import { Types } from 'mongoose';

import connectDB from '@/lib/db';
import { auth } from '@/lib/auth';
import Project from '@/models/Project';
import Script from '@/models/Script';
import type { ScriptLean } from '@/models/Script';

export default async function ProjectScriptsPage({ params }: { params: { projectId: string } }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/signin');
  }

  if (!Types.ObjectId.isValid(params.projectId)) {
    notFound();
  }

  await connectDB();
  const project = await Project.findOne({ _id: params.projectId, ownerId: session.user.id })
    .select({ _id: 1 })
    .lean();
  if (!project) {
    notFound();
  }

  const script = await Script.findOne({ projectId: project._id, ownerId: session.user.id })
    .select({ _id: 1 })
    .lean<ScriptLean | null>();

  if (script) {
    redirect(`/projects/${params.projectId}/scripts/${script._id.toString()}`);
  }

  redirect(`/projects/${params.projectId}/scripts/new`);
}
