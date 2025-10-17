import { describe, expect, beforeEach, it, vi, afterEach } from 'vitest';

import { GET, POST } from '@/app/api/projects/route';

const findMock = vi.hoisted(() => vi.fn());
const createMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth-helpers', () => ({
  requireUser: vi.fn()
}));

vi.mock('@/lib/db', () => ({
  __esModule: true,
  default: vi.fn(),
  connectDB: vi.fn(() => Promise.resolve())
}));

vi.mock('@/models/Project', () => ({
  __esModule: true,
  default: {
    find: findMock,
    create: createMock
  }
}));

import { requireUser } from '@/lib/auth-helpers';

function buildRequest(method: string, body?: unknown) {
  return new Request('http://localhost/api/projects', {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json' }
  });
}

describe('Projects API', () => {
const requireUserMock = vi.mocked(requireUser);

beforeEach(() => {
  requireUserMock.mockResolvedValue({ id: 'user-1' } as any);
    findMock.mockReset();
    createMock.mockReset();
  });

afterEach(() => {
  vi.clearAllMocks();
  requireUserMock.mockReset();
});

  it('returns a list of projects for the current user', async () => {
    const leanMock = vi.fn().mockResolvedValue([
      {
        _id: { toString: () => 'p1' },
        title: 'Launch Plan',
        description: 'Roadmap for season one',
        tags: ['podcast'],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-02-01')
      }
    ]);
    const sortMock = vi.fn().mockReturnValue({ lean: leanMock });
    findMock.mockReturnValue({ sort: sortMock });

    const response = await GET(buildRequest('GET'));
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data[0]).toMatchObject({ id: 'p1', title: 'Launch Plan', tags: ['podcast'] });
  });

  it('creates a new project', async () => {
    const projectDoc = {
      _id: { toString: () => 'new-project' },
      title: 'New Project',
      description: '',
      tags: [],
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date('2024-03-01')
    };
    createMock.mockResolvedValue(projectDoc);

    const response = await POST(
      buildRequest('POST', {
        title: 'New Project',
        description: '',
        tags: []
      })
    );

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data).toMatchObject({ id: 'new-project', title: 'New Project' });
    expect(createMock).toHaveBeenCalled();
  });
});
