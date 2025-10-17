'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock, Edit3, FileText, MoreHorizontal, Sparkles, Trash2, Volume2 } from 'lucide-react';

import { ProjectForm } from '@/components/forms/project-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils/cn';

type ScriptStatus = 'draft' | 'generating' | 'ready' | 'error';

interface ProjectTableItem {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  script?: {
    id: string;
    topic: string;
    status: ScriptStatus;
    tone: string;
    style: string;
    lengthMinutes: number;
    chapters: number;
    targetWordCount: number;
    actualWordCount: number;
    createdAt: string;
    updatedAt: string;
    voice?: {
      voiceId: string;
      voiceName: string;
      updatedAt: string;
      audioUrl: string;
    };
  };
}

interface ProjectsTableProps {
  projects: ProjectTableItem[];
}

const gradients = [
  'from-sky-500/20 via-sky-500/10 to-transparent',
  'from-purple-500/20 via-purple-500/10 to-transparent',
  'from-emerald-500/20 via-emerald-500/10 to-transparent',
  'from-orange-500/20 via-orange-500/10 to-transparent'
];

const STATUS_LABEL: Record<ScriptStatus, string> = {
  draft: 'Drafting',
  generating: 'Generating',
  ready: 'Ready',
  error: 'Needs attention'
};

const STATUS_VARIANT: Record<ScriptStatus, 'default' | 'secondary' | 'outline'> = {
  draft: 'default',
  generating: 'default',
  ready: 'secondary',
  error: 'outline'
};

function formatDate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });
}

function formatTimeAgo(iso: string) {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffMinutes = Math.round(diffMs / 60000);
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

export function ProjectsTable({ projects }: ProjectsTableProps) {
  const router = useRouter();
  const [editingProject, setEditingProject] = React.useState<ProjectTableItem | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleDelete = async (projectId: string) => {
    if (!window.confirm('Delete this project? Its script will also be removed.')) {
      return;
    }

    try {
      setDeletingId(projectId);
      const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to delete project');
      }
      toast({ title: 'Project deleted' });
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: 'Unable to delete project', description: message, variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const renderEmptyState = () => (
    <div className="relative overflow-hidden rounded-3xl border border-dashed bg-background/40 p-12 text-center">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-900/5 via-transparent to-slate-900/10" />
      <div className="relative mx-auto flex max-w-lg flex-col items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-6 w-6" />
        </span>
        <h2 className="text-2xl font-semibold">Create your first project</h2>
        <p className="text-sm text-muted-foreground">
          Projects bundle your brand context with a single AI generated script. Start one to see guidance, status, and word
          count insights all in one place.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {projects.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {projects.map((project, index) => {
            const script = project.script;
            const gradient = gradients[index % gradients.length];
            const completion =
              script && script.targetWordCount > 0
                ? Math.min(100, Math.round((script.actualWordCount / script.targetWordCount) * 100))
                : 0;
            const statusLabel = script ? STATUS_LABEL[script.status] : 'No script yet';
            const statusVariant = script ? STATUS_VARIANT[script.status] : 'outline';

            return (
              <article
                key={project.id}
                className="relative overflow-hidden rounded-3xl border bg-card shadow-sm transition hover:shadow-md"
              >
                <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br', gradient)} />
                <div className="relative flex h-full flex-col gap-6 p-6">
                  <header className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold">{project.title}</h2>
                        <Badge variant={statusVariant}>{statusLabel}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {project.description || 'Share context so ClipVox can tailor the script perfectly.'}
                      </p>
                      {project.tags && project.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {project.tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-background/80 px-3 py-1 text-xs text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Project actions">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Project</DropdownMenuLabel>
                        <DropdownMenuItem
                          onSelect={(event) => {
                            event.preventDefault();
                            setEditingProject(project);
                          }}
                          className="gap-2"
                        >
                          <Edit3 className="h-4 w-4" />
                          Edit details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="gap-2 text-destructive focus:text-destructive"
                          onSelect={() => handleDelete(project.id)}
                          disabled={deletingId === project.id}
                        >
                          <Trash2 className="h-4 w-4" />
                          {deletingId === project.id ? 'Deleting…' : 'Delete project'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </header>

                  <section className="rounded-2xl border border-white/10 bg-background/70 p-5 shadow-inner backdrop-blur-sm">
                    {script ? (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {script.topic}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Updated {formatTimeAgo(script.updatedAt)}
                          </span>
                        </div>
                        <dl className="grid gap-4 sm:grid-cols-3 text-sm">
                          <div className="space-y-1 rounded-xl bg-muted/40 p-3">
                            <dt className="text-muted-foreground">Length</dt>
                            <dd className="font-medium">{script.lengthMinutes} minutes · {script.chapters ?? 0} chapters</dd>
                          </div>
                          <div className="space-y-1 rounded-xl bg-muted/40 p-3">
                            <dt className="text-muted-foreground">Tone & Style</dt>
                            <dd className="font-medium capitalize">
                              {script.tone}
                              {script.style ? ` · ${script.style}` : ''}
                            </dd>
                          </div>
                          <div className="space-y-1 rounded-xl bg-muted/40 p-3">
                            <dt className="text-muted-foreground">Words</dt>
                            <dd className="font-medium">
                              {script.actualWordCount.toLocaleString()} / {script.targetWordCount.toLocaleString()}
                            </dd>
                          </div>
                        </dl>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Script completeness</span>
                            <span>{completion}%</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn(
                                'h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all',
                                completion === 100 && 'from-emerald-500 to-emerald-400'
                              )}
                              style={{ width: `${completion}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {script.voice
                            ? `Voice ready — ${script.voice.voiceName} · ${formatTimeAgo(script.voice.updatedAt)}`
                            : 'Voiceover not generated yet'}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 text-sm">
                        <div className="flex items-center gap-2 font-medium">
                          <CalendarClock className="h-4 w-4 text-muted-foreground" />
                          No script yet
                        </div>
                        <p className="text-muted-foreground">
                          Generate a script to unlock pacing tips, word-count targets, and production notes tailored to this project.
                        </p>
                        <ul className="grid gap-2 sm:grid-cols-2 text-xs text-muted-foreground">
                          <li className="rounded-lg border border-dashed px-3 py-2">Guided brief with tone presets</li>
                          <li className="rounded-lg border border-dashed px-3 py-2">Automatic outline + word budget</li>
                          <li className="rounded-lg border border-dashed px-3 py-2">Save edits + track progress</li>
                          <li className="rounded-lg border border-dashed px-3 py-2">Ready for audio & video pipelines</li>
                        </ul>
                      </div>
                    )}
                  </section>

                  <footer className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>Updated {formatDate(project.updatedAt)}</span>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => router.push(`/projects/${project.id}${script ? '' : '/scripts/new'}`)}
                      >
                        {script ? 'Open script' : 'Generate script'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/projects/${project.id}`)}
                      >
                        View project
                      </Button>
                    </div>
                  </footer>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <Dialog open={Boolean(editingProject)} onOpenChange={(open) => setEditingProject(open ? editingProject : null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit project</DialogTitle>
          </DialogHeader>
          {editingProject ? (
            <ProjectForm
              project={editingProject}
              onSuccess={() => {
                setEditingProject(null);
                router.refresh();
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
