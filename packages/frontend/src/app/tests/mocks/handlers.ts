import { http, HttpResponse } from 'msw';

interface MockUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

const ULID_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const MOCK_ULID_PREFIX = '01ARZ3NDEKTSV4RRFFQ69G5F';

const initialUsers: MockUser[] = [
  {
    id: '01ARZ3NDEKTSV4RRFFQ69G5F00',
    name: 'Test User 1',
    email: 'test1@example.com',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '01ARZ3NDEKTSV4RRFFQ69G5F01',
    name: 'Test User 2',
    email: 'test2@example.com',
    createdAt: '2024-01-02T00:00:00.000Z',
  },
];

let users: MockUser[] = [...initialUsers];
let nextMockUserSequence = initialUsers.length;

const createMockUserId = () => {
  // MSWの作成レスポンスでも本番APIと同じULID形式を返し、UIテストの型前提を揃える。
  const high = Math.floor(nextMockUserSequence / ULID_ALPHABET.length) % ULID_ALPHABET.length;
  const low = nextMockUserSequence % ULID_ALPHABET.length;
  nextMockUserSequence += 1;
  return `${MOCK_ULID_PREFIX}${ULID_ALPHABET.charAt(high)}${ULID_ALPHABET.charAt(low)}`;
};

const resetMockData = () => {
  users = [...initialUsers];
  nextMockUserSequence = initialUsers.length;
};

/** MSW handlers for client-side API mocking. */
const handlers = [
  // GET /api/v1/users
  http.get('/api/v1/users', () => {
    return HttpResponse.json(users);
  }),

  // POST /api/v1/users
  http.post('/api/v1/users', async ({ request }) => {
    // Artificial delay so UI can show a loading state.
    await new Promise((resolve) => setTimeout(resolve, 75));

    const body = (await request.json()) as { name: string; email: string };
    const newUser: MockUser = {
      id: createMockUserId(),
      name: body.name,
      email: body.email,
      createdAt: new Date().toISOString(),
    };
    users = [...users, newUser];
    return HttpResponse.json(newUser, { status: 201 });
  }),

  // GET /api/v1/users/:id
  http.get('/api/v1/users/:id', ({ params }) => {
    const { id } = params;
    const userId = String(id);
    const found = users.find((u) => u.id === userId);
    if (found == null) {
      return HttpResponse.json({ error: 'Not Found' }, { status: 404 });
    }
    return HttpResponse.json(found);
  }),
];

export { handlers, resetMockData };
