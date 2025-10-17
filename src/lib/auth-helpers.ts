import { auth } from './auth';
import { HttpError } from './errors';

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new HttpError(401, 'Unauthorized');
  }
  return session.user;
}
