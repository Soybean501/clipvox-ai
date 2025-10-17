import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';

import { SignInForm } from './sign-in-form';

export const metadata = {
  title: 'Sign in | ClipVox'
};

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to manage your ClipVox projects.</p>
        </div>
        <SignInForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          No account yet?{' '}
          <Link href="/signup" className="text-primary underline">
            Create one now
          </Link>
        </p>
      </div>
    </div>
  );
}
