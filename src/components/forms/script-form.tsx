'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Clock, Gauge, List, Wand2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { ScriptCreateSchema } from '@/lib/zod';
import { cn } from '@/lib/utils/cn';
import { targetWords } from '@/lib/utils/wpm';

const TONES = [
  { value: 'educational', label: 'Educational', description: 'Clear, instructional, friendly' },
  { value: 'documentary', label: 'Documentary', description: 'Narrative, cinematic authority' },
  { value: 'conversational', label: 'Conversational', description: 'Casual, approachable, podcast' },
  { value: 'bedtime', label: 'Bedtime', description: 'Soft, calm, gentle pacing' },
  { value: 'dramatic', label: 'Dramatic', description: 'Bold, energetic, high stakes' },
  { value: 'custom', label: 'Custom', description: 'Describe your own style' }
] as const;

const LENGTH_PRESETS = [
  { label: 'Quick intro · 3 min', minutes: 3, chapters: 3 },
  { label: 'YouTube spotlight · 7 min', minutes: 7, chapters: 5 },
  { label: 'Deep dive · 12 min', minutes: 12, chapters: 7 }
] as const;

type ToneValue = (typeof TONES)[number]['value'];

interface ScriptFormProps {
  projectId: string;
  projectTitle?: string;
  onCreated?: (scriptId: string) => void;
}

export function ScriptForm({ projectId, projectTitle, onCreated }: ScriptFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [values, setValues] = React.useState({
    topic: '',
    tone: 'educational' as ToneValue,
    style: '',
    lengthMinutes: 5,
    chapters: 5
  });

  const estimatedWords = React.useMemo(
    () => targetWords(values.lengthMinutes || 0, values.tone, values.style),
    [values.lengthMinutes, values.tone, values.style]
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: name === 'lengthMinutes' || name === 'chapters' ? Number(value) : value }));
  };

  const selectTone = (tone: ToneValue) => {
    setValues((prev) => ({ ...prev, tone }));
  };

  const applyPreset = (minutes: number, chapters: number) => {
    setValues((prev) => ({ ...prev, lengthMinutes: minutes, chapters }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const parsed = ScriptCreateSchema.safeParse({
      projectId,
      topic: values.topic,
      tone: values.tone,
      style: values.style || undefined,
      lengthMinutes: Number(values.lengthMinutes),
      chapters: Number(values.chapters)
    });

    if (!parsed.success) {
      toast({ title: 'Invalid input', description: parsed.error.errors[0]?.message, variant: 'destructive' });
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data)
      });

      if (response.status === 409) {
        const data = await response.json().catch(() => ({}));
        const existingId = data.script?.id as string | undefined;
        toast({
          title: 'Script already exists',
          description: 'We opened the saved script so you can continue refining it.'
        });
        if (existingId) {
          router.push(`/projects/${projectId}/scripts/${existingId}`);
          router.refresh();
          onCreated?.(existingId);
          return;
        }
        throw new Error(data.error ?? 'A script already exists for this project.');
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to generate script');
      }

      const script = await response.json();
      toast({ title: 'Script is ready', description: 'Generation completed successfully.' });
      router.push(`/projects/${projectId}/scripts/${script.id}`);
      router.refresh();
      onCreated?.(script.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: 'Generation failed', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className="grid gap-6 p-6 md:grid-cols-[minmax(0,2fr),minmax(0,1fr)]"
      onSubmit={handleSubmit}
    >
      <div className="space-y-6">
        <section className="space-y-4 rounded-2xl border bg-background p-6 shadow-sm">
          <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
            <Wand2 className="h-4 w-4 text-primary" />
            Brief for {projectTitle ?? 'this project'}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="topic">
              What should this script cover?
            </label>
            <Textarea
              id="topic"
              name="topic"
              value={values.topic}
              onChange={handleChange}
              placeholder="Explain quantum computing for curious high school students with real-world analogies."
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              Add key points, audience, or calls-to-action. We will weave them into the structure automatically.
            </p>
          </div>
        </section>

        <section className="space-y-6 rounded-2xl border bg-background p-6 shadow-sm">
          <div className="space-y-2">
            <p className="text-sm font-medium">Voice & tone</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {TONES.map((tone) => {
                const active = values.tone === tone.value;
                return (
                  <button
                    key={tone.value}
                    type="button"
                    onClick={() => selectTone(tone.value)}
                    className={cn(
                      'flex h-full flex-col gap-1 rounded-xl border p-3 text-left transition hover:border-primary/60 hover:bg-primary/5',
                      active ? 'border-primary bg-primary/10 text-primary-foreground' : 'border-muted'
                    )}
                    aria-pressed={active}
                  >
                    <span className="text-sm font-medium text-foreground">{tone.label}</span>
                    <span className="text-xs text-muted-foreground">{tone.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="style">
                Describe the narration style
              </label>
              <Input
                id="style"
                name="style"
                placeholder="Conversational, fast pace, witty transitions"
                value={values.style}
                onChange={handleChange}
              />
              <p className="text-xs text-muted-foreground">Optional — add pacing or personality cues.</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Target runtime</p>
            <div className="flex flex-wrap gap-2">
              {LENGTH_PRESETS.map((preset) => {
                const active = values.lengthMinutes === preset.minutes && values.chapters === preset.chapters;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPreset(preset.minutes, preset.chapters)}
                    className={cn(
                      'rounded-full border px-4 py-2 text-xs font-medium transition hover:border-primary/70 hover:bg-primary/5',
                      active ? 'border-primary bg-primary/10 text-primary-foreground' : 'border-muted text-muted-foreground'
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="lengthMinutes">
                  Minutes
                </label>
                <Input
                  id="lengthMinutes"
                  name="lengthMinutes"
                  type="number"
                  min={1}
                  max={300}
                  value={values.lengthMinutes}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="chapters">
                  Chapters / segments
                </label>
                <Input
                  id="chapters"
                  name="chapters"
                  type="number"
                  min={1}
                  max={50}
                  value={values.chapters}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" disabled={submitting} className="min-w-[200px]">
            {submitting ? 'Generating…' : 'Generate script'}
          </Button>
          <p className="text-xs text-muted-foreground">
            ClipVox will draft your script in under 10 seconds and keep future edits in sync with this project.
          </p>
        </div>
      </div>

      <aside className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <BookOpen className="h-4 w-4" />
          Production preview
        </div>
        <div className="grid gap-4">
          <div className="rounded-xl border border-primary/20 bg-background p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Estimated word budget</p>
            <p className="text-lg font-semibold">{estimatedWords.toLocaleString()} words</p>
            <p className="text-xs text-muted-foreground">
              Based on {values.lengthMinutes} minute runtime and {values.tone} tone.
            </p>
          </div>
          <div className="rounded-xl border border-primary/20 bg-background p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Structure</p>
            <p className="text-sm font-medium">{values.chapters} chapters</p>
            <p className="text-xs text-muted-foreground">
              ClipVox builds headings automatically so post-production is effortless.
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-dashed border-primary/30 p-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-medium text-primary">
            <Gauge className="h-4 w-4" />
            Pro tip
          </div>
          <p className="mt-2">
            Add timing notes or milestones inside your topic brief. We transform them into chapter intros and callouts.
          </p>
        </div>
        <ul className="space-y-3 text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <Clock className="mt-0.5 h-3.5 w-3.5 text-primary" />
            Regenerate anytime — we keep your edits so you can iterate quickly.
          </li>
          <li className="flex items-start gap-2">
            <List className="mt-0.5 h-3.5 w-3.5 text-primary" />
            Chapters sync with audio and video tooling rolling out next.
          </li>
        </ul>
      </aside>
    </form>
  );
}
