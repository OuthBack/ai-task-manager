"use client";

import { useState, useCallback } from "react";
import { generateTasks } from "@/services/ai.service";
import { ApiError } from "@/services/api";
import type { AiGenerateState } from "@/types/task.types";

function getAiErrorMessage(statusCode: number, rawMessage: string): string {
  const map: Record<number, string> = {
    400: "Preencha o objetivo e a API Key antes de gerar.",
    401: "API Key inválida. Verifique sua chave do Gemini e tente novamente.",
    422:
      rawMessage.includes("vazio") || rawMessage.includes("empty")
        ? "A IA não conseguiu gerar tarefas. Tente reformular o objetivo."
        : "A resposta da IA veio em formato inesperado. Tente novamente.",
    429: "Limite de requisições da IA atingido. Aguarde e tente novamente.",
    502: "A IA retornou uma resposta que não pôde ser interpretada. Tente novamente.",
    503: "O serviço de IA não respondeu a tempo. Verifique sua conexão.",
  };
  return map[statusCode] ?? "Ocorreu um erro no servidor. Tente novamente.";
}

interface UseAiGenerateReturn extends AiGenerateState {
  generate: (objective: string, apiKey: string) => Promise<void>;
}

export function useAiGenerate(
  onSuccess?: (count: number) => void,
): UseAiGenerateReturn {
  const [state, setState] = useState<AiGenerateState>({
    isLoading: false,
    error: null,
  });

  const generate = useCallback(
    async (objective: string, apiKey: string) => {
      try {
        setState({ isLoading: true, error: null });

        const tasks = await generateTasks({ objective, apiKey });

        setState({ isLoading: false, error: null });
        onSuccess?.(tasks.length);
      } catch (err) {
        let message: string;

        if (err instanceof ApiError) {
          message = getAiErrorMessage(err.statusCode, err.message);
        } else {
          message =
            err instanceof Error
              ? err.message
              : "Erro desconhecido ao gerar tarefas";
        }

        setState({ isLoading: false, error: message });
        throw err;
      }
    },
    [onSuccess],
  );

  return {
    isLoading: state.isLoading,
    error: state.error,
    generate,
  };
}
