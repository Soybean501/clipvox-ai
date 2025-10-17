'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';

export function SignUpForm() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [values, setValues] = React.useState({ name: '', email: '', password: '' });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? 'Unable to create account');
      }

      await signIn('credentials', {
        redirect: false,
        email: values.email,
        password: values.password
      });

      toast({ title: 'Account ready', description: 'Welcome to ClipVox!' });
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      toast({
        title: 'Sign up failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="name">
          Name
        </label>
        <Input id="name" name="name" value={values.name} onChange={handleChange} placeholder="Your name" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="email">
          Email
        </label>
        <Input id="email" name="email" type="email" required value={values.email} onChange={handleChange} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="password">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          value={values.password}
          onChange={handleChange}
        />
        <p className="text-xs text-muted-foreground">Use at least 8 characters to keep your account safe.</p>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating…' : 'Create account'}
      </Button>
    </form>
  );
}
