'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LogOut, Mic2, Notebook, SquareStack } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface AppShellProps {
  children: React.ReactNode;
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: SquareStack },
  { href: '/projects', label: 'Projects', icon: Notebook },
  { href: '/voices', label: 'Voices', icon: Mic2, comingSoon: true }
];

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-64 flex-col border-r bg-background p-6 md:flex">
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
            CV
          </div>
          <div>
            <p className="text-lg font-semibold">ClipVox</p>
            <p className="text-xs text-muted-foreground">Script studio</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.comingSoon ? '#' : item.href}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted',
                  active ? 'bg-muted text-foreground' : 'text-muted-foreground',
                  item.comingSoon && 'pointer-events-none opacity-50'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {item.comingSoon ? (
                  <span className="ml-auto text-xs text-muted-foreground">Soon</span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-2 text-sm">
          <p className="font-medium">{user?.name ?? user?.email ?? 'Anonymous'}</p>
          <Button
            variant="ghost"
            className="justify-start gap-2 text-muted-foreground"
            onClick={() => signOut({ callbackUrl: '/signin' })}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-8">
          <div>
            <p className="text-base font-semibold text-muted-foreground md:hidden">ClipVox</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground md:hidden">
            {user?.name ?? user?.email ?? 'Account'}
            <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: '/signin' })}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto w-full max-w-5xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
