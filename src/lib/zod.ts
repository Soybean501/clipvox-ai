import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

export const ProjectCreateSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string().min(1).max(30)).max(10).optional()
});

export const ProjectUpdateSchema = ProjectCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'No changes provided'
  }
);

export const ScriptCreateSchema = z.object({
  projectId: z.string().min(1),
  topic: z.string().min(5).max(200),
  tone: z.enum(['educational', 'bedtime', 'documentary', 'conversational', 'dramatic', 'custom']),
  style: z.string().max(120).optional(),
  lengthMinutes: z.number().int().min(1).max(300),
  chapters: z.number().int().min(1).max(50)
});

export const ScriptUpdateSchema = z
  .object({
    topic: z.string().min(5).max(200).optional(),
    tone: z.enum(['educational', 'bedtime', 'documentary', 'conversational', 'dramatic', 'custom']).optional(),
    style: z.string().max(120).optional().or(z.literal('')),
    lengthMinutes: z.number().int().min(1).max(300).optional(),
    chapters: z.number().int().min(1).max(50).optional(),
    content: z.string().max(30_000).optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'No changes provided'
  });
