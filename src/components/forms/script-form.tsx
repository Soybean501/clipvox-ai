'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { ScriptCreateSchema } from '@/lib/zod';

const TONES = [
  { value: 'educational', label: 'Educational' },
  { value: 'documentary', label: 'Documentary' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'bedtime', label: 'Bedtime' },
  { value: 'dramatic', label: 'Dramatic' },
  { value: 'custom', label: 'Custom' }
] as const;

type ToneValue = (typeof TONES)[number]['value'];

interface ScriptFormProps {
  projectId: string;
  onCreated?: (scriptId: string) => void;
}

export function ScriptForm({ projectId, onCreated }: ScriptFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [values, setValues] = React.useState({
    topic: '',
    tone: 'educational' as ToneValue,
    style: '',
    lengthMinutes: 5,
    chapters: 5
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: name === 'lengthMinutes' || name === 'chapters' ? Number(value) : value }));
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
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="topic">
          Topic
        </label>
        <Textarea
          id="topic"
          name="topic"
          value={values.topic}
          onChange={handleChange}
          placeholder="Explain quantum computing for high school students"
          rows={3}
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
          <Input
            id="style"
            name="style"
            placeholder="Conversational, fast pace"
            value={values.style}
            onChange={handleChange}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="lengthMinutes">
            Length (minutes)
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
            required
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Generating…' : 'Generate script'}
      </Button>
      <p className="text-xs text-muted-foreground">
        Script generation typically takes 5–10 seconds. You can continue editing once it is ready.
      </p>
    </form>
  );
}
