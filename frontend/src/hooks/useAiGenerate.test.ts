import { renderHook, act } from '@testing-library/react';
import { useAiGenerate } from './useAiGenerate';
import * as aiService from '@/services/ai.service';
import { ApiError } from '@/services/api';
import type { Task } from '@/types/task.types';

jest.mock('@/services/ai.service');

const mockedService = aiService as jest.Mocked<typeof aiService>;

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Learn TypeScript',
    isCompleted: false,
    isAiGenerated: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'Build a project',
    isCompleted: false,
    isAiGenerated: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

describe('useAiGenerate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve inicializar com estado vazio', () => {
    // Arrange & Act
    const { result } = renderHook(() => useAiGenerate());

    // Assert
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('deve gerar tarefas com sucesso', async () => {
    // Arrange
    mockedService.generateTasks.mockResolvedValue(mockTasks);
    const onSuccess = jest.fn();

    const { result } = renderHook(() => useAiGenerate(onSuccess));

    // Act
    await act(async () => {
      await result.current.generate('Learn Next.js', 'test-api-key');
    });

    // Assert
    expect(mockedService.generateTasks).toHaveBeenCalledWith({
      objective: 'Learn Next.js',
      apiKey: 'test-api-key',
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(onSuccess).toHaveBeenCalledWith(2);
  });

  it('deve mapear erro 400 para mensagem sobre campos obrigatórios', async () => {
    // Arrange
    mockedService.generateTasks.mockRejectedValue(
      new ApiError('Missing fields', 400),
    );

    const { result } = renderHook(() => useAiGenerate());

    // Act & Assert
    await act(async () => {
      await expect(
        result.current.generate('Goal', 'api-key'),
      ).rejects.toThrow();
    });

    expect(result.current.error).toBe(
      'Preencha o objetivo e a API Key antes de gerar.',
    );
  });

  it('deve mapear erro 401 para API Key inválida', async () => {
    // Arrange
    mockedService.generateTasks.mockRejectedValue(
      new ApiError('Invalid API Key', 401),
    );

    const { result } = renderHook(() => useAiGenerate());

    // Act & Assert
    await act(async () => {
      await expect(
        result.current.generate('Goal', 'invalid-key'),
      ).rejects.toThrow();
    });

    expect(result.current.error).toBe(
      'API Key inválida. Verifique sua chave do Gemini e tente novamente.',
    );
  });

  it('deve mapear erro 422 para mensagem sobre tarefas vazias', async () => {
    // Arrange
    mockedService.generateTasks.mockRejectedValue(
      new ApiError('Response array vazio', 422),
    );

    const { result } = renderHook(() => useAiGenerate());

    // Act & Assert
    await act(async () => {
      await expect(
        result.current.generate('Goal', 'api-key'),
      ).rejects.toThrow();
    });

    expect(result.current.error).toContain('não conseguiu gerar tarefas');
  });

  it('deve mapear erro 429 para limite de requisições', async () => {
    // Arrange
    mockedService.generateTasks.mockRejectedValue(
      new ApiError('Rate limit exceeded', 429),
    );

    const { result } = renderHook(() => useAiGenerate());

    // Act & Assert
    await act(async () => {
      await expect(
        result.current.generate('Goal', 'api-key'),
      ).rejects.toThrow();
    });

    expect(result.current.error).toContain('Limite de requisições');
  });

  it('deve mapear erro 503 para timeout do serviço', async () => {
    // Arrange
    mockedService.generateTasks.mockRejectedValue(
      new ApiError('Service Unavailable', 503),
    );

    const { result } = renderHook(() => useAiGenerate());

    // Act & Assert
    await act(async () => {
      await expect(
        result.current.generate('Goal', 'api-key'),
      ).rejects.toThrow();
    });

    expect(result.current.error).toContain('não respondeu a tempo');
  });

  it('deve usar mensagem genérica para status desconhecido', async () => {
    // Arrange
    mockedService.generateTasks.mockRejectedValue(
      new ApiError('Unknown error', 999),
    );

    const { result } = renderHook(() => useAiGenerate());

    // Act & Assert
    await act(async () => {
      await expect(
        result.current.generate('Goal', 'api-key'),
      ).rejects.toThrow();
    });

    expect(result.current.error).toBe(
      'Ocorreu um erro no servidor. Tente novamente.',
    );
  });

  it('deve lidar com erro não-ApiError', async () => {
    // Arrange
    mockedService.generateTasks.mockRejectedValue(
      new Error('Network error'),
    );

    const { result } = renderHook(() => useAiGenerate());

    // Act & Assert
    await act(async () => {
      await expect(
        result.current.generate('Goal', 'api-key'),
      ).rejects.toThrow();
    });

    expect(result.current.error).toBe('Network error');
  });

  it('deve chamar onSuccess com número de tarefas geradas', async () => {
    // Arrange
    mockedService.generateTasks.mockResolvedValue(mockTasks);
    const onSuccess = jest.fn();

    const { result } = renderHook(() => useAiGenerate(onSuccess));

    // Act
    await act(async () => {
      await result.current.generate('Goal', 'api-key');
    });

    // Assert
    expect(onSuccess).toHaveBeenCalledWith(2);
  });

  it('não deve chamar onSuccess em caso de erro', async () => {
    // Arrange
    mockedService.generateTasks.mockRejectedValue(
      new ApiError('Error', 400),
    );
    const onSuccess = jest.fn();

    const { result } = renderHook(() => useAiGenerate(onSuccess));

    // Act & Assert
    await act(async () => {
      await expect(
        result.current.generate('Goal', 'api-key'),
      ).rejects.toThrow();
    });

    expect(onSuccess).not.toHaveBeenCalled();
  });
});
