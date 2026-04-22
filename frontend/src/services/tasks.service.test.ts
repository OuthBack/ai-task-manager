import { getTasks, createTask, updateTask, deleteTask } from './tasks.service';
import { ApiError } from './api';
import type { Task } from '@/types/task.types';

jest.mock('./api', () => ({
  request: jest.fn(),
  ApiError: Error,
}));

const { request } = require('./api');

describe('tasks service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve chamar GET /tasks e retornar array de tarefas', async () => {
    // Arrange
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Task 1',
        isCompleted: false,
        isAiGenerated: false,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];
    request.mockResolvedValue(mockTasks);

    // Act
    const result = await getTasks();

    // Assert
    expect(request).toHaveBeenCalledWith('/tasks', { method: 'GET' });
    expect(result).toEqual(mockTasks);
  });

  it('deve retornar array vazio quando não há tarefas', async () => {
    // Arrange
    request.mockResolvedValue([]);

    // Act
    const result = await getTasks();

    // Assert
    expect(result).toEqual([]);
  });

  it('deve chamar POST /tasks com payload para criar tarefa', async () => {
    // Arrange
    const newTask: Task = {
      id: '2',
      title: 'New Task',
      isCompleted: false,
      isAiGenerated: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    request.mockResolvedValue(newTask);

    // Act
    const result = await createTask({ title: 'New Task' });

    // Assert
    expect(request).toHaveBeenCalledWith('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'New Task' }),
    });
    expect(result).toEqual(newTask);
  });

  it('deve chamar PATCH /tasks/:id com payload para atualizar tarefa', async () => {
    // Arrange
    const updatedTask: Task = {
      id: '1',
      title: 'Updated Task',
      isCompleted: true,
      isAiGenerated: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
    };
    request.mockResolvedValue(updatedTask);

    // Act
    const result = await updateTask('1', {
      title: 'Updated Task',
      isCompleted: true,
    });

    // Assert
    expect(request).toHaveBeenCalledWith('/tasks/1', {
      method: 'PATCH',
      body: JSON.stringify({
        title: 'Updated Task',
        isCompleted: true,
      }),
    });
    expect(result).toEqual(updatedTask);
  });

  it('deve suportar atualização parcial (somente isCompleted)', async () => {
    // Arrange
    const updatedTask: Task = {
      id: '1',
      title: 'Task 1',
      isCompleted: true,
      isAiGenerated: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
    };
    request.mockResolvedValue(updatedTask);

    // Act
    const result = await updateTask('1', { isCompleted: true });

    // Assert
    expect(request).toHaveBeenCalledWith('/tasks/1', {
      method: 'PATCH',
      body: JSON.stringify({ isCompleted: true }),
    });
    expect(result).toEqual(updatedTask);
  });

  it('deve chamar DELETE /tasks/:id para deletar tarefa', async () => {
    // Arrange
    request.mockResolvedValue(undefined);

    // Act
    const result = await deleteTask('1');

    // Assert
    expect(request).toHaveBeenCalledWith('/tasks/1', { method: 'DELETE' });
    expect(result).toBeUndefined();
  });
});
