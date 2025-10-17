import { redirect } from 'next/navigation';

import { AppShell } from '@/components/layouts/app-shell';
import { ProjectsTable } from '@/components/tables/projects-table';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Project from '@/models/Project';
import type { ProjectLean } from '@/models/Project';
import Script from '@/models/Script';
import type { ScriptLean } from '@/models/Script';

import { CreateProjectDialog } from './create-project-dialog';

interface ProjectOverviewItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  script?: {
    id: string;
    topic: string;
    status: ScriptLean['status'];
    tone: ScriptLean['tone'];
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

function toISO(date: Date | undefined): string {
  return (date ?? new Date()).toISOString();
}

async function fetchProjects(ownerId: string): Promise<ProjectOverviewItem[]> {
  await connectDB();
  const projects = await Project.find({ ownerId }).sort({ updatedAt: -1 }).lean<ProjectLean[]>();
  if (projects.length === 0) {
    return [];
  }

  const projectIds = projects.map((project) => project._id);
  const scripts = await Script.find({ ownerId, projectId: { $in: projectIds } }).lean<ScriptLean[]>();
  const scriptMap = new Map<string, ScriptLean>(
    scripts.map((script) => [script.projectId.toString(), script])
  );

  return projects.map((project) => {
    const script = scriptMap.get(project._id.toString());
    return {
      id: project._id.toString(),
      title: project.title,
      description: project.description,
      tags: project.tags,
      createdAt: toISO(project.createdAt),
      updatedAt: toISO(project.updatedAt),
      script: script
        ? {
            id: script._id.toString(),
            topic: script.topic,
            status: script.status,
            tone: script.tone,
            style: script.style,
            lengthMinutes: script.lengthMinutes,
            chapters: script.chapters,
            targetWordCount: script.targetWordCount,
            actualWordCount: script.actualWordCount,
            createdAt: toISO(script.createdAt),
            updatedAt: toISO(script.updatedAt),
            voice:
              script.voice && script.voice.voiceId
                ? {
                    voiceId: script.voice.voiceId,
                    voiceName: script.voice.voiceName,
                    updatedAt: toISO(script.voice.updatedAt),
                    audioUrl: `/api/scripts/${script._id.toString()}/voice/audio?ts=${script.voice.updatedAt?.getTime() ?? Date.now()}`
                  }
                : undefined
          }
        : undefined
    };
  });
}

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/signin');
  }

  const projects = await fetchProjects(session.user.id);

  return (
    <AppShell user={session.user}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Group scripts by series, channel, or campaign. Audio and video tooling arrive next.
          </p>
        </div>
        <CreateProjectDialog />
      </div>
      <ProjectsTable projects={projects} />
    </AppShell>
  );
}
