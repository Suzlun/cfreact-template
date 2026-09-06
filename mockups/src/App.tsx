import { useState, useSyncExternalStore } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@cfreact-template/ui/components/alert';
import { Badge } from '@cfreact-template/ui/components/badge';
import { Button } from '@cfreact-template/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@cfreact-template/ui/components/card';
import { Input } from '@cfreact-template/ui/components/input';
import { Label } from '@cfreact-template/ui/components/label';
import { Progress } from '@cfreact-template/ui/components/progress';
import { Separator } from '@cfreact-template/ui/components/separator';
import { Spinner } from '@cfreact-template/ui/components/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@cfreact-template/ui/components/table';

function subscribeToRoute(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => {
    window.removeEventListener('hashchange', onChange);
  };
}

function getRoute() {
  return window.location.hash === '#/users' ? '/users' : '/';
}

const initialTimestamp = Date.UTC(2025, 0, 1, 9);
const initialUsers = [
  {
    id: '01JGFJJZ000000000000000001',
    name: 'Alice Example',
    email: 'alice@example.com',
    createdAt: initialTimestamp,
  },
  {
    id: '01JGFJJZ000000000000000002',
    name: 'Bob Example',
    email: 'bob@example.com',
    createdAt: initialTimestamp + 60_000,
  },
];
const techStackItems = [
  'React 19',
  'Vite 8',
  'React Router 7',
  'TanStack Query 5',
  'shadcn/ui',
  'Hono 4',
  'Drizzle ORM 0.45',
  'TypeScript 5.9',
  'Cloudflare Workers',
];

function Home({ onRefresh, timestamp }: { onRefresh: () => void; timestamp: number }) {
  return (
    <div className="space-y-8">
      <div className="grid items-stretch gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border bg-muted/40 p-6 sm:p-8">
          <div className="flex max-w-2xl flex-col gap-4">
            <Badge variant="outline" className="w-fit">
              Cloudflare · React · Hono
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome to cfreact-template
            </h1>
            <p className="text-muted-foreground">
              フルスタックで Workers を動かすためのスターター。React + TanStack Query + Hono +
              Drizzle をすぐに試せます。
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                render={<a href="#/users" />}
                nativeButton={false}
                size="lg"
                onClick={(event) => {
                  event.preventDefault();
                  window.location.hash = '/users';
                }}
              >
                View Users
              </Button>
              <Button variant="outline" size="lg" onClick={onRefresh}>
                Refresh Hello API
              </Button>
            </div>
          </div>
        </section>
        <Card>
          <CardHeader>
            <CardTitle>API Health</CardTitle>
            <CardDescription>Live response from /api/v1/hello</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mt-1 space-y-3">
              <p className="font-semibold">Hello from Hono + Cloudflare Workers</p>
              <p className="text-sm text-muted-foreground">
                Timestamp: {new Date(timestamp).toLocaleString('en-US', { timeZone: 'UTC' })}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>200 OK</Badge>
                <Badge variant="outline">Workers</Badge>
                <Badge variant="outline">Hono</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tech Stack</CardTitle>
          <CardDescription>What powers this template</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {techStackItems.map((item) => (
              <Badge key={item} variant="outline">
                {item}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UsersTable({ users }: { users: typeof initialUsers }) {
  if (users.length === 0) {
    return (
      <div className="rounded-lg border p-10 text-center">
        <h2 className="text-lg font-semibold">No users found</h2>
        <p className="mt-1 text-sm text-muted-foreground">Create one above to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.id}</TableCell>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                {new Date(user.createdAt).toLocaleString('en-US', { timeZone: 'UTC' })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * 固定データとローカル状態だけでホームとユーザー管理の操作を再現する。
 * URLのハッシュで画面を切り替え、クエリのscenarioを初期状態として適用する。
 */
export function App() {
  const route = useSyncExternalStore(subscribeToRoute, getRoute);
  const scenario = new URLSearchParams(window.location.search).get('scenario') ?? 'default';
  const [users, setUsers] = useState(scenario === 'empty-users' ? [] : initialUsers);
  const [listState, setListState] = useState(
    scenario === 'users-loading' || scenario === 'users-error' ? scenario : 'ready'
  );
  const [name, setName] = useState(scenario === 'create-error' ? 'Alice Example' : '');
  const [email, setEmail] = useState(scenario === 'create-error' ? 'alice@example.com' : '');
  const [createError, setCreateError] = useState(scenario === 'create-error');
  const [timestamp, setTimestamp] = useState(initialTimestamp);
  const isValid = name.trim() !== '' && email.trim() !== '';

  return (
    <div className="min-h-screen bg-background pb-10 text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between gap-4">
          <a
            href="#/"
            className="text-lg font-semibold tracking-tight"
            onClick={(event) => {
              event.preventDefault();
              window.location.hash = '/';
            }}
          >
            cfreact-template
          </a>
          <nav className="flex items-center gap-1" aria-label="Main navigation">
            <Button
              render={<a href="#/" />}
              nativeButton={false}
              variant="ghost"
              onClick={(event) => {
                event.preventDefault();
                window.location.hash = '/';
              }}
            >
              Home
            </Button>
            <Button
              render={<a href="#/users" />}
              nativeButton={false}
              variant="ghost"
              onClick={(event) => {
                event.preventDefault();
                window.location.hash = '/users';
              }}
            >
              Users
            </Button>
          </nav>
        </div>
      </header>
      <main className="container py-6 sm:py-8">
        <div className="rounded-xl border bg-card p-4 text-card-foreground shadow-sm sm:p-6 lg:p-8">
          {route === '/' ? (
            <Home
              onRefresh={() => {
                setTimestamp((previous) => previous + 60_000);
              }}
              timestamp={timestamp}
            />
          ) : (
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  User Directory
                </p>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Users</h1>
                <p className="text-muted-foreground">
                  Create users, validate inputs, and view them in a responsive table.
                </p>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Create New User</CardTitle>
                  <CardDescription>
                    名前とメールアドレスを入力してユーザーを作成します
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                    }}
                  >
                    <div className="space-y-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="user-name">Name</Label>
                          <Input
                            id="user-name"
                            placeholder="Name"
                            value={name}
                            onChange={(event) => {
                              setName(event.target.value);
                              setCreateError(false);
                            }}
                            required
                            autoComplete="name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="user-email">Email</Label>
                          <Input
                            id="user-email"
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(event) => {
                              setEmail(event.target.value);
                              setCreateError(false);
                            }}
                            aria-invalid={createError ? true : undefined}
                            aria-describedby={
                              createError ? 'user-create-error-description' : undefined
                            }
                            required
                            autoComplete="email"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          type="submit"
                          disabled={!isValid}
                          data-loading="false"
                          onClick={(event) => {
                            // 静的プレビューのsandbox内でも、フォーム送信なしで入力検証とローカル操作を行う。
                            event.preventDefault();
                            if (!isValid || event.currentTarget.form?.reportValidity() !== true)
                              return;
                            if (users.some((user) => user.email === email)) {
                              setCreateError(true);
                              return;
                            }
                            setUsers((previous) => [
                              ...previous,
                              {
                                id: `01JGFJJZ00${String(previous.length + 1).padStart(16, '0')}`,
                                name,
                                email,
                                createdAt: initialTimestamp + previous.length * 60_000,
                              },
                            ]);
                            setName('');
                            setEmail('');
                            setCreateError(false);
                            setListState('ready');
                          }}
                        >
                          Create User
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setListState('ready');
                          }}
                        >
                          Refresh List
                        </Button>
                      </div>
                      {createError && (
                        <Alert
                          variant="destructive"
                          aria-labelledby="user-create-error-title"
                          aria-describedby="user-create-error-description"
                        >
                          <AlertTitle id="user-create-error-title">
                            User could not be created
                          </AlertTitle>
                          <AlertDescription id="user-create-error-description">
                            A user with this email address already exists. Enter a different email
                            address and try again. Your current entries are preserved.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>
              {listState === 'users-loading' && (
                <div className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Spinner />
                    <span>Loading users...</span>
                  </div>
                  <Progress value={45} aria-label="Loading users" />
                </div>
              )}
              {listState === 'users-error' && (
                <Alert
                  variant="destructive"
                  aria-labelledby="users-list-error-title"
                  aria-describedby="users-list-error-description"
                >
                  <AlertTitle id="users-list-error-title">Users could not be loaded</AlertTitle>
                  <AlertDescription id="users-list-error-description">
                    The user list is not displayed. Check your connection, then select Refresh List.
                    Your form entries are preserved.
                  </AlertDescription>
                </Alert>
              )}
              {listState === 'ready' && <UsersTable users={users} />}
              <Separator />
              <div className="text-sm text-muted-foreground">
                <p>Powered by Cloudflare Workers + Hono + Drizzle</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
