import { NextResponse } from 'next/server';

import { logger } from './logger';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : 'Internal server error';
  logger.error({ error: message }, 'Unhandled route error');
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
