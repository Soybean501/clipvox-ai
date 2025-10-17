'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { ScriptUpdateSchema } from '@/lib/zod';

const TONES = [
  { value: 'educational', label: 'Educational' },
  { value: 'documentary', label: 'Documentary' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'bedtime', label: 'Bedtime' },
  { value: 'dramatic', label: 'Dramatic' },
  { value: 'custom', label: 'Custom' }
] as const;

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
    status: string;
  };
}

export function ScriptEditor({ script }: ScriptEditorProps) {
  const router = useRouter();
  const [values, setValues] = React.useState({
    topic: script.topic,
    tone: script.tone,
    style: script.style,
    lengthMinutes: script.lengthMinutes,
    chapters: script.chapters,
    content: script.content
  });
  const [saving, setSaving] = React.useState(false);
  const [estimating, setEstimating] = React.useState(false);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setValues((prev) => ({
      ...prev,
      [name]: name === 'lengthMinutes' || name === 'chapters' ? Number(value) : value
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

      toast({ title: 'Script saved' });
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

  const handleEstimate = async () => {
    setEstimating(true);
    try {
      const res = await fetch(`/api/scripts/${script.id}/estimate`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Unable to refresh estimate');
      }
      const data = await res.json();
      toast({
        title: 'Estimate refreshed',
        description: `Target ${data.targetWordCount} words, actual ${data.actualWordCount}.`
      });
      router.refresh();
    } catch (error) {
      toast({
        title: 'Estimate failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setEstimating(false);
    }
  };

  const delta = script.actualWordCount - script.targetWordCount;
  const withinRange = Math.abs(delta) <= script.targetWordCount * 0.1;

  React.useEffect(() => {
    setValues({
      topic: script.topic,
      tone: script.tone,
      style: script.style,
      lengthMinutes: script.lengthMinutes,
      chapters: script.chapters,
      content: script.content
    });
  }, [script]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="topic">
            Topic
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
        <div className="grid gap-4 sm:grid-cols-2">
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
            <Input id="style" name="style" value={values.style} onChange={handleChange} placeholder="upbeat, fast" />
          </div>
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
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={withinRange ? 'secondary' : 'outline'}>
          {script.actualWordCount} / {script.targetWordCount} words{' '}
          {delta === 0 ? '' : delta > 0 ? `(+${delta})` : `(${delta})`}
        </Badge>
        <Badge variant="outline">Status: {script.status}</Badge>
        <Button variant="ghost" size="sm" onClick={handleEstimate} disabled={estimating}>
          {estimating ? 'Recalculating…' : 'Refresh estimate'}
        </Button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="content">
          Script content
        </label>
        <Textarea
          id="content"
          name="content"
          rows={24}
          value={values.content}
          onChange={handleChange}
          className="font-mono text-sm"
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
        <Button variant="outline" onClick={() => router.push(`/projects/${script.projectId}/scripts`)}>
          Back to scripts
        </Button>
      </div>
    </div>
  );
}
