import { API_BASE_URL } from '@/config/api';
import { type AuthUser } from './auth-api';

export interface UsersResponse {
  success: boolean;
  users: AuthUser[];
}

export interface UserInput {
  email: string;
  password: string;
  displayName: string;
  role: 'user' | 'admin';
  isEmailVerified: boolean;
}

export interface SingleUserResponse {
  success: boolean;
  user: AuthUser;
}

export interface DeleteUserResponse {
  success: boolean;
  message: string;
}

async function apiRequest<T>(path: string, options: RequestInit, accessToken: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || 'The request failed. Please try again.');
  }
  return data as T;
  } finally { clearTimeout(timeout); }
}

export function fetchUsers(accessToken: string): Promise<UsersResponse> {
  return apiRequest<UsersResponse>('/api/users', { method: 'GET' }, accessToken);
}

export function createUser(accessToken: string, payload: UserInput): Promise<SingleUserResponse> {
  return apiRequest<SingleUserResponse>('/api/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, accessToken);
}

export function updateUser(accessToken: string, id: string, payload: Partial<Omit<UserInput, 'email'>>): Promise<SingleUserResponse> {
  return apiRequest<SingleUserResponse>(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, accessToken);
}

export function deleteUser(accessToken: string, id: string): Promise<DeleteUserResponse> {
  return apiRequest<DeleteUserResponse>(`/api/users/${id}`, { method: 'DELETE' }, accessToken);
}
