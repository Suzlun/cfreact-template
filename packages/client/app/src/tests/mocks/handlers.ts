import { http, HttpResponse } from 'msw';

/** MSW handlers for client-side API mocking. */
const handlers = [
  // GET /api/users
  http.get('http://localhost:8787/api/users', () => {
    return HttpResponse.json([
      {
        id: 1,
        name: 'Test User 1',
        email: 'test1@example.com',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 2,
        name: 'Test User 2',
        email: 'test2@example.com',
        createdAt: '2024-01-02T00:00:00.000Z',
      },
    ]);
  }),

  // POST /api/users
  http.post('http://localhost:8787/api/users', async ({ request }) => {
    const body = (await request.json()) as { name: string; email: string };
    return HttpResponse.json(
      {
        id: 3,
        name: body.name,
        email: body.email,
        createdAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  // GET /api/users/:id
  http.get('http://localhost:8787/api/users/:id', ({ params }) => {
    const { id } = params;
    const idString = String(id ?? '');
    return HttpResponse.json({
      id: Number(id),
      name: `Test User ${idString}`,
      email: `test${idString}@example.com`,
      createdAt: '2024-01-01T00:00:00.000Z',
    });
  }),
];

export { handlers };
