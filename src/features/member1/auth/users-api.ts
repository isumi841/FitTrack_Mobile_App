import { API_BASE_URL } from '@/config/api';
import { type AuthUser } from './auth-api';

export interface UsersResponse {
  success: boolean;
  users: AuthUser[];
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
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API Request Failed');
  }
  return data as T;
}

export function fetchUsers(accessToken: string): Promise<UsersResponse> {
  return apiRequest<UsersResponse>('/api/users', { method: 'GET' }, accessToken);
}

export function createUser(accessToken: string, payload: any): Promise<SingleUserResponse> {
  return apiRequest<SingleUserResponse>('/api/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, accessToken);
}

export function updateUser(accessToken: string, id: string, payload: any): Promise<SingleUserResponse> {
  return apiRequest<SingleUserResponse>(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, accessToken);
}

export function deleteUser(accessToken: string, id: string): Promise<DeleteUserResponse> {
  return apiRequest<DeleteUserResponse>(`/api/users/${id}`, { method: 'DELETE' }, accessToken);
}
