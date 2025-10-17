import { notFound, redirect } from 'next/navigation';
import { Types } from 'mongoose';

import { AppShell } from '@/components/layouts/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScriptEditor } from '@/components/editors/ScriptEditor';
import connectDB from '@/lib/db';
import { auth } from '@/lib/auth';
import Project from '@/models/Project';
import Script from '@/models/Script';

export default async function ScriptDetailPage({
  params
}: {
  params: { projectId: string; scriptId: string };
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/signin');
  }

  if (!Types.ObjectId.isValid(params.projectId) || !Types.ObjectId.isValid(params.scriptId)) {
    notFound();
  }

  await connectDB();
  const project = await Project.findOne({ _id: params.projectId, ownerId: session.user.id }).lean();
  if (!project) {
    notFound();
  }

  const script = await Script.findOne({ _id: params.scriptId, projectId: project._id, ownerId: session.user.id }).lean();
  if (!script) {
    notFound();
  }

  const editorScript = {
    id: script._id.toString(),
    projectId: script.projectId.toString(),
    topic: script.topic,
    tone: script.tone,
    style: script.style,
    lengthMinutes: script.lengthMinutes,
    chapters: script.chapters,
    content: script.content,
    targetWordCount: script.targetWordCount,
    actualWordCount: script.actualWordCount,
    status: script.status
  };

  return (
    <AppShell user={session.user}>
      <Card>
        <CardHeader>
          <CardTitle>{script.topic}</CardTitle>
          <CardDescription>
            Target length {script.lengthMinutes} minutes · {script.chapters} chapters · tone {script.tone}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScriptEditor script={editorScript} />
        </CardContent>
      </Card>
    </AppShell>
  );
}
