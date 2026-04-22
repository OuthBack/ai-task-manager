import { request } from './api';
import type {
  Task,
  CreateTaskPayload,
  UpdateTaskPayload,
} from '@/types/task.types';

export async function getTasks(): Promise<Task[]> {
  return request<Task[]>('/tasks', { method: 'GET' });
}

export async function createTask(
  payload: CreateTaskPayload,
): Promise<Task> {
  return request<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateTask(
  id: string,
  payload: UpdateTaskPayload,
): Promise<Task> {
  return request<Task>(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteTask(id: string): Promise<void> {
  return request<void>(`/tasks/${id}`, { method: 'DELETE' });
}
