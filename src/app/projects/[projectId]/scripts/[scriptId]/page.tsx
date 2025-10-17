import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Types } from 'mongoose';
import { ArrowLeft, Sparkles } from 'lucide-react';

import { ScriptEditor } from '@/components/editors/ScriptEditor';
import { AppShell } from '@/components/layouts/app-shell';
import { Card } from '@/components/ui/card';
import connectDB from '@/lib/db';
import { auth } from '@/lib/auth';
import Project from '@/models/Project';
import type { ProjectLean } from '@/models/Project';
import Script from '@/models/Script';
import type { ScriptLean } from '@/models/Script';

interface ScriptPageParams {
  projectId: string;
  scriptId: string;
}

function formatSummary(script: ScriptLean) {
  return `${script.lengthMinutes} minute runtime · ${script.chapters} chapters · ${script.tone} tone`;
}

export default async function ScriptDetailPage({ params }: { params: ScriptPageParams }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/signin');
  }

  if (!Types.ObjectId.isValid(params.projectId) || !Types.ObjectId.isValid(params.scriptId)) {
    notFound();
  }

  await connectDB();
  const project = await Project.findOne({ _id: params.projectId, ownerId: session.user.id }).lean<ProjectLean>();
  if (!project) {
    notFound();
  }

  const script = await Script.findOne({
    _id: params.scriptId,
    projectId: project._id,
    ownerId: session.user.id
  }).lean<ScriptLean | null>();

  if (!script) {
    notFound();
  }

  const voice =
    script.voice && script.voice.voiceId
      ? {
          provider: script.voice.provider,
          voiceId: script.voice.voiceId,
          voiceName: script.voice.voiceName,
          audioFormat: script.voice.audioFormat,
          durationSeconds: script.voice.durationSeconds ?? undefined,
          createdAt: script.voice.createdAt?.toISOString(),
          updatedAt: script.voice.updatedAt?.toISOString(),
          audioUrl: `/api/scripts/${script._id.toString()}/voice/audio?ts=${script.voice.updatedAt?.getTime() ?? Date.now()}`
        }
      : null;

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
    status: script.status,
    updatedAt: script.updatedAt,
    voice
  };

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

        <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 shadow-sm">
          <div className="flex flex-col gap-4">
            <span className="flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Script workspace
            </span>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">{script.topic}</h1>
              <p className="text-sm text-muted-foreground">{formatSummary(script)}</p>
            </div>
          </div>
        </section>

        <Card className="overflow-hidden border bg-background shadow-lg">
          <ScriptEditor script={editorScript} />
        </Card>
      </div>
    </AppShell>
  );
}
