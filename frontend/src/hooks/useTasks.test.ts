import { renderHook, act } from '@testing-library/react';
import { useTasks } from './useTasks';
import * as tasksService from '@/services/tasks.service';
import type { Task } from '@/types/task.types';

jest.mock('@/services/tasks.service');

const mockedService = tasksService as jest.Mocked<typeof tasksService>;

const mockTask: Task = {
  id: '1',
  title: 'Test Task',
  isCompleted: false,
  isAiGenerated: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('useTasks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve inicializar com estado vazio', () => {
    // Arrange & Act
    const { result } = renderHook(() => useTasks());

    // Assert
    expect(result.current.tasks).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('deve carregar tarefas com refreshTasks', async () => {
    // Arrange
    const mockTasks = [mockTask];
    mockedService.getTasks.mockResolvedValue(mockTasks);

    const { result } = renderHook(() => useTasks());

    // Act
    await act(async () => {
      await result.current.refreshTasks();
    });

    // Assert
    expect(mockedService.getTasks).toHaveBeenCalled();
    expect(result.current.tasks).toEqual(mockTasks);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('deve definir erro ao falhar ao carregar tarefas', async () => {
    // Arrange
    mockedService.getTasks.mockRejectedValue(
      new Error('Network error'),
    );

    const { result } = renderHook(() => useTasks());

    // Act
    await act(async () => {
      await result.current.refreshTasks();
    });

    // Assert
    expect(result.current.tasks).toEqual([]);
    expect(result.current.error).toBe('Network error');
  });

  it('deve criar tarefa e adicioná-la à lista', async () => {
    // Arrange
    mockedService.createTask.mockResolvedValue(mockTask);

    const { result } = renderHook(() => useTasks());

    // Act
    await act(async () => {
      await result.current.createTask('Test Task');
    });

    // Assert
    expect(mockedService.createTask).toHaveBeenCalledWith({
      title: 'Test Task',
    });
    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0]).toEqual(mockTask);
  });

  it('deve atualizar estado de erro ao falhar na criação', async () => {
    // Arrange
    mockedService.createTask.mockRejectedValue(
      new Error('Validation error'),
    );

    const { result } = renderHook(() => useTasks());

    // Act & Assert
    await act(async () => {
      await expect(
        result.current.createTask(''),
      ).rejects.toThrow('Validation error');
    });

    expect(result.current.error).toBe('Validation error');
  });

  it('deve fazer toggle otimista de tarefa', async () => {
    // Arrange
    mockedService.updateTask.mockResolvedValue({
      ...mockTask,
      isCompleted: true,
    });

    const { result } = renderHook(() => useTasks());

    // Setup: adiciona uma tarefa
    await act(async () => {
      result.current.addTasks([mockTask]);
    });

    expect(result.current.tasks[0].isCompleted).toBe(false);

    // Act: toggle imediato (otimista)
    await act(async () => {
      result.current.toggleTask('1');
    });

    // Assert: otimismo — já está true antes da resposta da API
    expect(result.current.tasks[0].isCompleted).toBe(true);
    expect(mockedService.updateTask).toHaveBeenCalledWith('1', {
      isCompleted: true,
    });
  });

  it('deve reverter toggle otimista em caso de erro', async () => {
    // Arrange
    mockedService.updateTask.mockRejectedValue(
      new Error('Update failed'),
    );

    const { result } = renderHook(() => useTasks());

    await act(async () => {
      result.current.addTasks([mockTask]);
    });

    const originalState = result.current.tasks[0].isCompleted;

    // Act & Assert
    await act(async () => {
      await expect(result.current.toggleTask('1')).rejects.toThrow(
        'Update failed',
      );
    });

    // Deve estar revertido para o estado original
    expect(result.current.tasks[0].isCompleted).toBe(originalState);
  });

  it('deve deletar tarefa com otimismo', async () => {
    // Arrange
    mockedService.deleteTask.mockResolvedValue(undefined);

    const { result } = renderHook(() => useTasks());

    await act(async () => {
      result.current.addTasks([mockTask]);
    });

    expect(result.current.tasks).toHaveLength(1);

    // Act
    await act(async () => {
      await result.current.deleteTask('1');
    });

    // Assert: deletado imediatamente (otimista)
    expect(result.current.tasks).toHaveLength(0);
    expect(mockedService.deleteTask).toHaveBeenCalledWith('1');
  });

  it('deve reverter delete otimista em caso de erro', async () => {
    // Arrange
    mockedService.deleteTask.mockRejectedValue(
      new Error('Delete failed'),
    );

    const { result } = renderHook(() => useTasks());

    await act(async () => {
      result.current.addTasks([mockTask]);
    });

    // Act & Assert
    await act(async () => {
      await expect(result.current.deleteTask('1')).rejects.toThrow(
        'Delete failed',
      );
    });

    // Deve estar de volta na lista
    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0]).toEqual(mockTask);
  });

  it('deve adicionar novas tarefas (usado por useAiGenerate)', async () => {
    // Arrange
    const newTasks: Task[] = [
      {
        ...mockTask,
        id: '2',
        isAiGenerated: true,
      },
      {
        ...mockTask,
        id: '3',
        isAiGenerated: true,
      },
    ];

    const { result } = renderHook(() => useTasks());

    // Act
    await act(async () => {
      result.current.addTasks(newTasks);
    });

    // Assert
    expect(result.current.tasks).toHaveLength(2);
    expect(result.current.tasks[0].isAiGenerated).toBe(true);
    expect(result.current.tasks[1].isAiGenerated).toBe(true);
  });
});
