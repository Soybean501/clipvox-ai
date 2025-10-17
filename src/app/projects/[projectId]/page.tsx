import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Types } from 'mongoose';
import { ArrowRight, CalendarClock, FileText, Lightbulb, Sparkles } from 'lucide-react';

import { AppShell } from '@/components/layouts/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import connectDB from '@/lib/db';
import { auth } from '@/lib/auth';
import Project from '@/models/Project';
import type { ProjectLean } from '@/models/Project';
import Script from '@/models/Script';
import type { ScriptLean } from '@/models/Script';

interface ProjectPageParams {
  projectId: string;
}

type ScriptStatus = 'draft' | 'generating' | 'ready' | 'error';

function formatDate(iso: Date | undefined) {
  const date = iso ?? new Date();
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatTimeAgo(date: Date | undefined) {
  if (!date) return 'just now';
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

export default async function ProjectDetailPage({ params }: { params: ProjectPageParams }) {
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

  const script = await Script.findOne({
    projectId: project._id,
    ownerId: session.user.id
  }).lean<ScriptLean | null>();

  const status = (script?.status ?? 'draft') as ScriptStatus;
  const statusCopy: Record<ScriptStatus, { label: string; description: string }> = {
    draft: {
      label: 'Drafting',
      description: 'Set the brief and generate a tailored first draft.'
    },
    generating: {
      label: 'Generating',
      description: 'We are crafting narration that matches your brief.'
    },
    ready: {
      label: 'Ready',
      description: 'Script is ready for polishing or production.'
    },
    error: {
      label: 'Needs attention',
      description: 'Generation hit an issue. Review the script for details.'
    }
  };

  const completion =
    script && script.targetWordCount > 0
      ? Math.min(100, Math.round((script.actualWordCount / script.targetWordCount) * 100))
      : 0;

  return (
    <AppShell user={session.user}>
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.25),transparent_55%)]" />
          <div className="relative flex flex-col gap-6 p-8">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="bg-white/10 text-white backdrop-blur">
                {statusCopy[status].label}
              </Badge>
              <span className="text-xs text-slate-300">Updated {formatTimeAgo(project.updatedAt)}</span>
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold">{project.title}</h1>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-200">
                {project.description ||
                  'This project keeps your brand context, tags, and script in one place so production stays consistent.'}
              </p>
              {project.tags && project.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-slate-200">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-300">Created</p>
                <p className="text-sm font-medium text-white">{formatDate(project.createdAt)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-300">Last updated</p>
                <p className="text-sm font-medium text-white">{formatDate(project.updatedAt)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-300">Script status</p>
                <p className="text-sm font-medium text-white">{statusCopy[status].description}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="sm" variant="secondary" className="bg-white text-slate-900 hover:bg-slate-200">
                <Link href={script ? `/projects/${params.projectId}/scripts/${script._id.toString()}` : `/projects/${params.projectId}/scripts/new`}>
                  {script ? 'Open script workspace' : 'Generate script'}
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <Link href="/projects">Back to projects</Link>
              </Button>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-col gap-2 border-b bg-muted/40">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Script overview
              </CardTitle>
              <CardDescription>
                {script
                  ? `Updated ${formatTimeAgo(script.updatedAt)} · ${script.lengthMinutes} min · ${script.chapters} chapters`
                  : 'Set the brief to generate a script tailored to this project.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {script ? (
                <>
                  <div className="space-y-3">
                    <p className="text-sm font-medium">{script.topic}</p>
                    <p className="text-xs text-muted-foreground">
                      Tone {script.tone}
                      {script.style ? ` · ${script.style}` : ''}
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl bg-muted/40 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Length</p>
                      <p className="text-sm font-medium">{script.lengthMinutes} minutes</p>
                    </div>
                    <div className="rounded-xl bg-muted/40 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Word count</p>
                      <p className="text-sm font-medium">
                        {script.actualWordCount} / {script.targetWordCount}
                      </p>
                    </div>
                    <div className="rounded-xl bg-muted/40 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                      <p className="text-sm font-medium capitalize">{script.status}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Completion</span>
                      <span>{completion}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary via-primary/70 to-primary/40 transition-all"
                        style={{ width: `${completion}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" asChild>
                      <Link href={`/projects/${params.projectId}/scripts/${script._id.toString()}`} className="flex items-center gap-1">
                        Continue editing <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/projects/${params.projectId}/scripts/${script._id.toString()}`}>View script</Link>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    First script guidance
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Each project holds one evolving script. Generate it once, then keep refining as you get feedback from your team.
                  </p>
                  <ul className="grid gap-3 text-sm">
                    <li className="flex items-start gap-2 rounded-xl border border-dashed border-muted p-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                      Blend tone, pacing, and style to match your brand voice.
                    </li>
                    <li className="flex items-start gap-2 rounded-xl border border-dashed border-muted p-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                      Automatically receive word count targets for audio and video planning.
                    </li>
                    <li className="flex items-start gap-2 rounded-xl border border-dashed border-muted p-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                      Save edits and track revisions without leaving ClipVox.
                    </li>
                  </ul>
                  <div>
                    <Button asChild>
                      <Link href={`/projects/${params.projectId}/scripts/new`}>
                        Generate script <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="h-4 w-4 text-primary" />
                Production notes
              </CardTitle>
              <CardDescription>
                Keep your script aligned with downstream audio and video workflows.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="rounded-xl bg-white/60 p-4 text-slate-700 shadow-sm">
                <p className="font-medium text-slate-900">Next best action</p>
                <p>
                  {script ? 'Review the latest draft and lock your outline before generating narration.' : 'Set the brief to generate your first draft and unlock audio + video tooling.'}
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-lg border border-dashed border-primary/40 p-3">
                  <CalendarClock className="mt-1 h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium text-primary">Timing</p>
                    <p>
                      Target runtime is {script ? `${script.lengthMinutes} minutes.` : 'based on your brief.'} We will flag if narration pacing drifts.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-dashed border-primary/40 p-3">
                  <FileText className="mt-1 h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium text-primary">Outline</p>
                    <p>Every chapter maps directly to audio segments, making editing painless later on.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
