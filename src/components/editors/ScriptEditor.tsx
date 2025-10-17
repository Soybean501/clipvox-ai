'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils/cn';
import { countWords, targetWords } from '@/lib/utils/wpm';
import { ScriptUpdateSchema } from '@/lib/zod';

const TONES = [
  { value: 'educational', label: 'Educational' },
  { value: 'documentary', label: 'Documentary' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'bedtime', label: 'Bedtime' },
  { value: 'dramatic', label: 'Dramatic' },
  { value: 'custom', label: 'Custom' }
] as const;

type ToneValue = (typeof TONES)[number]['value'];
type ScriptStatus = 'draft' | 'generating' | 'ready' | 'error';

interface ScriptEditorProps {
  script: {
    id: string;
    projectId: string;
    topic: string;
    tone: string;
    style: string;
    lengthMinutes: number;
    chapters: number;
    content: string;
    targetWordCount: number;
  actualWordCount: number;
  status: ScriptStatus;
  updatedAt?: Date | string;
  };
}

function formatTimeAgo(date: Date | string | undefined) {
  if (!date) return 'just now';
  const instance = typeof date === 'string' ? new Date(date) : date;
  const diff = Date.now() - instance.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

const STATUS_BADGE: Record<ScriptStatus, 'default' | 'secondary' | 'outline'> = {
  draft: 'default',
  generating: 'default',
  ready: 'secondary',
  error: 'outline'
};

const STATUS_COPY: Record<ScriptStatus, string> = {
  draft: 'Keep refining until it sings.',
  generating: 'We are crafting narration that matches your brief.',
  ready: 'Lock the outline and send to production.',
  error: 'Generation hit an issue — review and retry.'
};

export function ScriptEditor({ script }: ScriptEditorProps) {
  const router = useRouter();
  const [values, setValues] = React.useState({
    topic: script.topic,
    tone: script.tone as ToneValue,
    style: script.style,
    lengthMinutes: script.lengthMinutes,
    chapters: script.chapters,
    content: script.content
  });
  const [saving, setSaving] = React.useState(false);

  const liveWordCount = React.useMemo(() => countWords(values.content), [values.content]);
  const liveTarget = React.useMemo(
    () => targetWords(Number(values.lengthMinutes) || 0, values.tone, values.style),
    [values.lengthMinutes, values.tone, values.style]
  );
  const completion =
    liveTarget > 0 ? Math.min(100, Math.round((liveWordCount / liveTarget) * 100)) : 0;
  const wordDelta = liveWordCount - liveTarget;
  const status = script.status;

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setValues((prev) => ({
      ...prev,
      [name]: name === 'lengthMinutes' || name === 'chapters' ? Number(value) : (value as string)
    }));
  };

  const handleSave = async () => {
    const parsed = ScriptUpdateSchema.safeParse({
      topic: values.topic,
      tone: values.tone,
      style: values.style,
      lengthMinutes: Number(values.lengthMinutes),
      chapters: Number(values.chapters),
      content: values.content
    });

    if (!parsed.success) {
      toast({
        title: 'Invalid input',
        description: parsed.error.errors.map((err) => err.message).join(', '),
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/scripts/${script.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Unable to save');
      }

      toast({ title: 'Script saved', description: 'Changes synced to your project.' });
      router.refresh();
    } catch (error) {
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  React.useEffect(() => {
    setValues({
      topic: script.topic,
      tone: script.tone as ToneValue,
      style: script.style,
      lengthMinutes: script.lengthMinutes,
      chapters: script.chapters,
      content: script.content
    });
  }, [script]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
      <div className="space-y-6">
        <section className="space-y-4 rounded-2xl border bg-background p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <Badge variant={STATUS_BADGE[status]} className="capitalize">
              {status}
            </Badge>
            <span>Last updated {formatTimeAgo(script.updatedAt)}</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium" htmlFor="topic">
                Script focus
              </label>
              <Textarea
                id="topic"
                name="topic"
                rows={3}
                value={values.topic}
                onChange={handleChange}
                placeholder="Explain quantum computing for curious teens"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="tone">
                Tone
              </label>
              <select
                id="tone"
                name="tone"
                value={values.tone}
                onChange={handleChange}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {TONES.map((tone) => (
                  <option key={tone.value} value={tone.value}>
                    {tone.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="style">
                Style
              </label>
              <Input
                id="style"
                name="style"
                value={values.style}
                onChange={handleChange}
                placeholder="Upbeat, fast, witty transitions"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="lengthMinutes">
                Runtime (minutes)
              </label>
              <Input
                id="lengthMinutes"
                name="lengthMinutes"
                type="number"
                min={1}
                max={300}
                value={values.lengthMinutes}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="chapters">
                Chapters
              </label>
              <Input
                id="chapters"
                name="chapters"
                type="number"
                min={1}
                max={50}
                value={values.chapters}
                onChange={handleChange}
              />
            </div>
          </div>
        </section>

        <section className="space-y-3 rounded-2xl border bg-background p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Script body
          </div>
          <Textarea
            id="content"
            name="content"
            rows={24}
            value={values.content}
            onChange={handleChange}
            className="font-mono text-sm"
          />
        </section>
      </div>

      <aside className="space-y-4">
        <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-6">
          <div>
            <p className="text-sm font-semibold text-primary">Production readiness</p>
            <p className="text-xs text-muted-foreground">{STATUS_COPY[status]}</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Word progress</span>
              <span>
                {liveWordCount.toLocaleString()} / {liveTarget.toLocaleString()} ({completion}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-primary/10">
              <div
                className={cn(
                  'h-full rounded-full bg-gradient-to-r from-primary via-primary/70 to-primary/40 transition-all',
                  completion >= 100 && 'from-emerald-500 via-emerald-400 to-emerald-300'
                )}
                style={{ width: `${Math.min(completion, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {wordDelta === 0
                ? 'Perfectly on target.'
                : wordDelta > 0
                  ? `About ${wordDelta} words above target — trim or tighten pacing.`
                  : `About ${Math.abs(wordDelta)} words below target — add a story beat or example.`}
            </p>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border bg-background p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Actions
          </p>
          <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push(`/projects/${script.projectId}`)}
            className="w-full gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to project overview
          </Button>
        </div>
      </aside>
    </div>
  );
}
