import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { AppSessionProvider } from '@/components/providers/session-provider';
import { Toaster } from '@/components/ui/use-toast';
import { auth } from '@/lib/auth';

import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'ClipVox',
  description: 'Generate production-ready narration scripts in minutes.'
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-background text-foreground">
        <AppSessionProvider session={session}>
          {children}
          <Toaster />
        </AppSessionProvider>
      </body>
    </html>
  );
}
