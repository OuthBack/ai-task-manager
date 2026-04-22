import { request } from './api';
import type { Task, GenerateTasksPayload } from '@/types/task.types';

export async function generateTasks(
  payload: GenerateTasksPayload,
): Promise<Task[]> {
  return request<Task[]>('/ai/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
