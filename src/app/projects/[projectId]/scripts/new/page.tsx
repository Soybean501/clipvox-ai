import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Types } from 'mongoose';
import { ArrowLeft, Sparkles } from 'lucide-react';

import { ScriptForm } from '@/components/forms/script-form';
import { AppShell } from '@/components/layouts/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import connectDB from '@/lib/db';
import { auth } from '@/lib/auth';
import Project from '@/models/Project';
import type { ProjectLean } from '@/models/Project';
import Script from '@/models/Script';
import type { ScriptLean } from '@/models/Script';

export default async function NewScriptPage({ params }: { params: { projectId: string } }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/signin');
  }

  if (!Types.ObjectId.isValid(params.projectId)) {
    notFound();
  }

  await connectDB();
  const project = await Project.findOne({ _id: params.projectId, ownerId: session.user.id }).lean<ProjectLean>();
  if (!project) {
    notFound();
  }

  const existingScript = await Script.findOne({
    projectId: project._id,
    ownerId: session.user.id
  }).lean<ScriptLean | null>();

  if (existingScript) {
    redirect(`/projects/${params.projectId}/scripts/${existingScript._id.toString()}`);
  }

  return (
    <AppShell user={session.user}>
      <div className="space-y-8">
        <Link
          href={`/projects/${params.projectId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {project.title}
        </Link>
        <Card className="overflow-hidden border-primary/10 shadow-lg">
          <CardHeader className="space-y-4 bg-muted/40">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
              Guided script generation
            </div>
            <CardTitle>Create a narration-ready script</CardTitle>
            <CardDescription>
              Set the tone, pacing, and structure once. ClipVox will generate a polished script that you can keep editing and
              refining for {project.title}.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScriptForm projectId={params.projectId} projectTitle={project.title} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
