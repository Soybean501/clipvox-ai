import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Types } from 'mongoose';

import { AppShell } from '@/components/layouts/app-shell';
import { Button } from '@/components/ui/button';
import { ScriptsTable } from '@/components/tables/scripts-table';
import connectDB from '@/lib/db';
import { auth } from '@/lib/auth';
import Project from '@/models/Project';
import Script from '@/models/Script';

export default async function ProjectScriptsPage({ params }: { params: { projectId: string } }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/signin');
  }

  if (!Types.ObjectId.isValid(params.projectId)) {
    notFound();
  }

  await connectDB();
  const project = await Project.findOne({ _id: params.projectId, ownerId: session.user.id }).lean();
  if (!project) {
    notFound();
  }

  const scripts = await Script.find({ projectId: project._id, ownerId: session.user.id })
    .sort({ updatedAt: -1 })
    .lean();

  const tableScripts = scripts.map((script) => ({
    id: script._id.toString(),
    topic: script.topic,
    tone: script.tone,
    style: script.style,
    lengthMinutes: script.lengthMinutes,
    chapters: script.chapters,
    status: script.status,
    actualWordCount: script.actualWordCount,
    targetWordCount: script.targetWordCount,
    updatedAt: script.updatedAt.toISOString(),
    createdAt: script.createdAt.toISOString()
  }));

  return (
    <AppShell user={session.user}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Scripts · {project.title}</h1>
          <p className="text-sm text-muted-foreground">Manage drafts, review word counts, and refine delivery.</p>
        </div>
        <Button asChild>
          <Link href={`/projects/${params.projectId}/scripts/new`}>Generate script</Link>
        </Button>
      </div>
      <ScriptsTable projectId={params.projectId} scripts={tableScripts} />
    </AppShell>
  );
}
