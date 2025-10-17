import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';

import { SignUpForm } from './sign-up-form';

export const metadata = {
  title: 'Sign up | ClipVox'
};

export default async function SignUpPage() {
  const session = await auth();
  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">Create your account</h1>
          <p className="text-sm text-muted-foreground">Start generating long-form scripts in minutes.</p>
        </div>
        <SignUpForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/signin" className="text-primary underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
