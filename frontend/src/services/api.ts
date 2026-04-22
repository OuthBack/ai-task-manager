const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (response.status === 204) return undefined as T;

  if (!response.ok) {
    const errorBody: Partial<ApiErrorResponse> = await response
      .json()
      .catch(() => ({}));
    const rawMessage = errorBody.message ?? `Erro HTTP ${response.status}`;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(', ')
      : rawMessage;
    throw new ApiError(message, errorBody.statusCode ?? response.status);
  }

  return response.json();
}
