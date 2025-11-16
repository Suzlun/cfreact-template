const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

export interface HelloResponse {
  message: string;
  timestamp: string;
}

interface ErrorResponse {
  error?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const headers = new Headers(options?.headers);
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = (await response.json()) as ErrorResponse;
      throw new Error(error.error ?? 'An error occurred');
    }

    return response.json() as Promise<T>;
  }

  async getHello(): Promise<HelloResponse> {
    return this.request<HelloResponse>('/hello');
  }

  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  async createUser(name: string, email: string): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify({ name, email }),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
