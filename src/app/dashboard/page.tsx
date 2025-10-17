import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AppShell } from '@/components/layouts/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import connectDB from '@/lib/db';
import { auth } from '@/lib/auth';
import Project from '@/models/Project';
import Script from '@/models/Script';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/signin');
  }

  await connectDB();

  const [projectCount, scriptCount, generatingCount, recentScripts] = await Promise.all([
    Project.countDocuments({ ownerId: session.user.id }),
    Script.countDocuments({ ownerId: session.user.id }),
    Script.countDocuments({ ownerId: session.user.id, status: 'generating' }),
    Script.find({ ownerId: session.user.id }).sort({ updatedAt: -1 }).limit(5).lean()
  ]);

  return (
    <AppShell user={session.user}>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Projects</CardDescription>
            <CardTitle className="text-3xl">{projectCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Organize scripts by show, client, or campaign.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Scripts</CardDescription>
            <CardTitle className="text-3xl">{scriptCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            All generated scripts across your portfolio.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>In production</CardDescription>
            <CardTitle className="text-3xl">{generatingCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Scripts currently generating with the AI planner.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent scripts</CardTitle>
            <CardDescription>Your latest generated or edited scripts.</CardDescription>
          </div>
          <Link href="/projects" className="text-sm text-primary underline">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentScripts.length === 0 && (
              <p className="text-sm text-muted-foreground">No scripts yet. Generate your first one.</p>
            )}
            {recentScripts.map((script) => (
              <div key={script._id.toString()} className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <p className="font-medium">{script.topic}</p>
                  <p className="text-xs text-muted-foreground">
                    {script.tone} · {script.lengthMinutes} min · {script.chapters} chapters
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 text-xs text-muted-foreground">
                  <Badge variant={script.status === 'ready' ? 'secondary' : script.status === 'error' ? 'outline' : 'default'}>
                    {script.status}
                  </Badge>
                  <Link
                    href={`/projects/${script.projectId.toString()}/scripts/${script._id.toString()}`}
                    className="text-primary underline"
                  >
                    Open
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
