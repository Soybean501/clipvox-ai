import { redirect } from 'next/navigation';

import { AppShell } from '@/components/layouts/app-shell';
import { ProjectsTable } from '@/components/tables/projects-table';
import { CreateProjectDialog } from './create-project-dialog';
import connectDB from '@/lib/db';
import { auth } from '@/lib/auth';
import Project from '@/models/Project';

async function fetchProjects(ownerId: string) {
  await connectDB();
  const projects = await Project.find({ ownerId }).sort({ updatedAt: -1 }).lean();
  return projects.map((project) => ({
    id: project._id.toString(),
    title: project.title,
    description: project.description,
    tags: project.tags,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString()
  }));
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
