import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Types } from 'mongoose';

import { AppShell } from '@/components/layouts/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import connectDB from '@/lib/db';
import { auth } from '@/lib/auth';
import Project from '@/models/Project';
import Script from '@/models/Script';

interface ProjectPageParams {
  projectId: string;
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
  const project = await Project.findOne({ _id: params.projectId, ownerId: session.user.id }).lean();
  if (!project) {
    notFound();
  }

  const [scriptCount, latestScripts] = await Promise.all([
    Script.countDocuments({ projectId: project._id, ownerId: session.user.id }),
    Script.find({ projectId: project._id, ownerId: session.user.id })
      .sort({ updatedAt: -1 })
      .limit(3)
      .lean()
  ]);

  return (
    <AppShell user={session.user}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{project.title}</h1>
          <p className="text-sm text-muted-foreground">
            {project.description || 'Use this project to organize related scripts, assets, and future audio/video outputs.'}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {project.tags?.map((tag: string) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/projects/${params.projectId}/scripts/new`}>Generate script</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/projects/${params.projectId}/scripts`}>View scripts</Link>
          </Button>
        </div>
      </div>
      <Tabs defaultValue="scripts">
        <TabsList>
          <TabsTrigger value="scripts">Scripts</TabsTrigger>
          <TabsTrigger value="audio" disabled>
            Audio
          </TabsTrigger>
          <TabsTrigger value="video" disabled>
            Video
          </TabsTrigger>
        </TabsList>
        <TabsContent value="scripts">
          <Card>
            <CardHeader>
              <CardTitle>Script overview</CardTitle>
              <CardDescription>
                {scriptCount === 0
                  ? 'No scripts in this project yet. Generate one to get started.'
                  : `${scriptCount} script${scriptCount === 1 ? '' : 's'} in this project.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {latestScripts.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nothing here yet. Head to the scripts tab to generate your first draft.
                </p>
              )}
              {latestScripts.map((script) => (
                <div key={script._id.toString()} className="flex items-center justify-between rounded-md border p-4">
                  <div>
                    <p className="font-medium">{script.topic}</p>
                    <p className="text-xs text-muted-foreground">
                      {script.tone} · {script.lengthMinutes} min · {script.chapters} chapters
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant={script.status === 'ready' ? 'secondary' : script.status === 'error' ? 'outline' : 'default'}>
                      {script.status}
                    </Badge>
                    <Link
                      href={`/projects/${params.projectId}/scripts/${script._id.toString()}`}
                      className="text-primary underline"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="audio">
          <Card>
            <CardHeader>
              <CardTitle>Audio pipeline</CardTitle>
              <CardDescription>
                Coming soon: pick voices, schedule TTS jobs, and review generated narration.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              We are designing the audio workflow with BullMQ workers, Redis coordination, and integrations with ElevenLabs/OpenAI TTS. Scripts generated here will feed directly into that pipeline.
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="video">
          <Card>
            <CardHeader>
              <CardTitle>Video timeline</CardTitle>
              <CardDescription>
                Storyboard timelines, trim clips, and attach overlays — all planned for a future sprint.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Video editing features will leverage FFmpeg workers, storyboard assets, and a rich timeline editor. Scripts generated today remain compatible with that roadmap.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
