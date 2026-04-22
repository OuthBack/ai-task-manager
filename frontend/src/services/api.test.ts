import { request, ApiError } from './api';

describe('api service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve fazer uma requisição GET e retornar dados parseados', async () => {
    // Arrange
    const mockData = { id: '1', title: 'Test' };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData,
    });

    // Act
    const result = await request('/test', { method: 'GET' });

    // Assert
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/test',
      expect.any(Object),
    );
    expect(result).toEqual(mockData);
  });

  it('deve fazer uma requisição POST com body JSON', async () => {
    // Arrange
    const mockData = { id: '1', title: 'Created' };
    const payload = { title: 'Created' };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => mockData,
    });

    // Act
    const result = await request('/test', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    // Assert
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/test',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
    expect(result).toEqual(mockData);
  });

  it('deve retornar undefined para status 204', async () => {
    // Arrange
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 204,
    });

    // Act
    const result = await request('/test', { method: 'DELETE' });

    // Assert
    expect(result).toBeUndefined();
  });

  it('deve lançar ApiError com statusCode quando resposta não é ok', async () => {
    // Arrange
    const errorResponse = {
      statusCode: 404,
      message: 'Resource not found',
      error: 'Not Found',
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => errorResponse,
    });

    // Act & Assert
    const error = await request('/test', { method: 'GET' }).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe('Resource not found');
    expect(error.statusCode).toBe(404);
  });

  it('deve normalizar message como array em erros de validação', async () => {
    // Arrange
    const errorResponse = {
      statusCode: 400,
      message: [
        'title must be a string',
        'title should not be empty',
      ],
      error: 'Bad Request',
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => errorResponse,
    });

    // Act & Assert
    const error = await request('/test', { method: 'POST' }).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe(
      'title must be a string, title should not be empty',
    );
  });

  it('deve usar statusCode do errorBody se disponível', async () => {
    // Arrange
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        statusCode: 422,
        message: 'Custom error',
        error: 'Unprocessable Entity',
      }),
    });

    // Act & Assert
    const error = await request('/test').catch((e) => e);
    expect(error.statusCode).toBe(422);
  });

  it('deve usar response.status se statusCode não vem no body', async () => {
    // Arrange
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Error' }),
    });

    // Act & Assert
    const error = await request('/test').catch((e) => e);
    expect(error.statusCode).toBe(500);
  });

  it('deve gerar mensagem genérica se json() falhar', async () => {
    // Arrange
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });

    // Act & Assert
    const error = await request('/test').catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe('Erro HTTP 500');
  });
});
