import { redirect } from 'next/navigation';

import { AppShell } from '@/components/layouts/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { listVoices } from '@/lib/ai/voices';
import { auth } from '@/lib/auth';

export default async function VoicesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/signin');
  }

  const voices = listVoices();

  return (
    <AppShell user={session.user}>
      <Card>
        <CardHeader>
          <CardTitle>Voice library</CardTitle>
          <CardDescription>Preview the voices available for instant narration.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {voices.map((voice) => (
            <div key={voice.id} className="rounded-xl border p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{voice.title}</p>
                  <p className="text-xs text-muted-foreground">{voice.description}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                    Provider: {voice.provider} · Voice id: {voice.id}
                  </p>
                </div>
                {voice.previewUrl ? (
                  <audio controls className="mt-2 w-full sm:mt-0 sm:w-auto" src={voice.previewUrl} />
                ) : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
