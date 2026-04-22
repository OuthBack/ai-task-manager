import { generateTasks } from './ai.service';
import type { Task } from '@/types/task.types';

jest.mock('./api', () => ({
  request: jest.fn(),
  ApiError: Error,
}));

const { request } = require('./api');

describe('ai service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve chamar POST /ai/generate com objetivo e apiKey', async () => {
    // Arrange
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Learn TypeScript',
        isCompleted: false,
        isAiGenerated: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];
    request.mockResolvedValue(mockTasks);

    // Act
    const result = await generateTasks({
      objective: 'Learn TypeScript in 30 days',
      apiKey: 'test-key',
    });

    // Assert
    expect(request).toHaveBeenCalledWith('/ai/generate', {
      method: 'POST',
      body: JSON.stringify({
        objective: 'Learn TypeScript in 30 days',
        apiKey: 'test-key',
      }),
    });
    expect(result).toEqual(mockTasks);
  });

  it('deve retornar array de tarefas geradas', async () => {
    // Arrange
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Task 1',
        isCompleted: false,
        isAiGenerated: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: '2',
        title: 'Task 2',
        isCompleted: false,
        isAiGenerated: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];
    request.mockResolvedValue(mockTasks);

    // Act
    const result = await generateTasks({
      objective: 'Goal',
      apiKey: 'key',
    });

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0].isAiGenerated).toBe(true);
    expect(result[1].isAiGenerated).toBe(true);
  });
});
