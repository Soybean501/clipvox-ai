'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { ProjectCreateSchema } from '@/lib/zod';

interface ProjectFormValues {
  title: string;
  description: string;
  tags: string;
}

interface ProjectFormProps {
  project?: {
    id: string;
    title: string;
    description?: string;
    tags?: string[];
  };
  onSuccess?: () => void;
}

export function ProjectForm({ project, onSuccess }: ProjectFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [values, setValues] = React.useState<ProjectFormValues>(() => ({
    title: project?.title ?? '',
    description: project?.description ?? '',
    tags: project?.tags?.join(', ') ?? ''
  }));

  React.useEffect(() => {
    setValues({
      title: project?.title ?? '',
      description: project?.description ?? '',
      tags: project?.tags?.join(', ') ?? ''
    });
  }, [project]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const tagsArray = values.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    const parsed = ProjectCreateSchema.safeParse({
      title: values.title,
      description: values.description || undefined,
      tags: tagsArray
    });

    if (!parsed.success) {
      toast({
        title: 'Invalid input',
        description: parsed.error.errors.map((err) => err.message).join(', '),
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(project ? `/api/projects/${project.id}` : '/api/projects', {
        method: project ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to save project');
      }

      toast({
        title: `Project ${project ? 'updated' : 'created'}`,
        description: project ? 'Project details saved.' : 'Project ready to go.'
      });
      router.refresh();
      onSuccess?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="title">
          Title
        </label>
        <Input id="title" name="title" value={values.title} onChange={handleChange} placeholder="Documentary Series" required />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="description">
          Description
        </label>
        <Textarea
          id="description"
          name="description"
          value={values.description}
          onChange={handleChange}
          placeholder="Optional context for your team."
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="tags">
          Tags
        </label>
        <Input
          id="tags"
          name="tags"
          value={values.tags}
          onChange={handleChange}
          placeholder="education, science"
        />
        <p className="text-xs text-muted-foreground">Comma separated, up to 10 tags.</p>
      </div>
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Saving…' : project ? 'Save project' : 'Create project'}
      </Button>
    </form>
  );
}
