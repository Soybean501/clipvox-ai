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
          <CardDescription>Preview voices that will power the upcoming TTS pipeline.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {voices.map((voice) => (
            <div key={voice.id} className="flex items-center justify-between rounded-md border p-4">
              <div>
                <p className="font-medium">{voice.title}</p>
                <p className="text-xs text-muted-foreground">Voice id: {voice.id}</p>
              </div>
              <a href={voice.demoUrl} className="text-sm text-primary underline" target="_blank" rel="noreferrer">
                Demo
              </a>
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
