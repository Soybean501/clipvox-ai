import { randomUUID } from 'crypto';

export function newId(prefix = 'id') {
  return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
}
