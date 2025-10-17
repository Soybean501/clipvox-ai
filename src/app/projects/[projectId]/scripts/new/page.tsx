import { notFound, redirect } from 'next/navigation';
import { Types } from 'mongoose';

import { AppShell } from '@/components/layouts/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScriptForm } from '@/components/forms/script-form';
import connectDB from '@/lib/db';
import { auth } from '@/lib/auth';
import Project from '@/models/Project';

export default async function NewScriptPage({ params }: { params: { projectId: string } }) {
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

  return (
    <AppShell user={session.user}>
      <Card>
        <CardHeader>
          <CardTitle>Generate a new script</CardTitle>
          <CardDescription>
            Provide tone, pacing, and structure — ClipVox will craft a narration-ready script for {project.title}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScriptForm projectId={params.projectId} />
        </CardContent>
      </Card>
    </AppShell>
  );
}
