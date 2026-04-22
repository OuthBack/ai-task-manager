"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Spinner } from "@/components/ui/Spinner";

interface AiGeneratorProps {
  onGenerate: (objective: string, apiKey: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function AiGenerator({
  onGenerate,
  isLoading = false,
  error = null,
}: AiGeneratorProps) {
  const [objective, setObjective] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isDisabled = !objective.trim() || !apiKey.trim() || isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    try {
      await onGenerate(objective, apiKey);
      setObjective("");
      setApiKey("");
      setSuccessMessage("Tarefas geradas com sucesso! 🎉");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      // Error is handled by parent component
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        type="text"
        placeholder="Ex: Quero aprender a programar"
        label="Objetivo"
        value={objective}
        onChange={(e) => setObjective(e.target.value)}
        disabled={isLoading}
        aria-label="AI objective"
      />

      <Input
        type="password"
        placeholder="Sua chave do Gemini"
        label="API Key do Gemini"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        disabled={isLoading}
        aria-label="Gemini API Key"
      />

      {error && <ErrorMessage message={error} />}

      {successMessage && (
        <div className="flex items-center gap-3 p-4 rounded-[12px] bg-gradient-to-r from-[#34C759]/10 to-[#2fa84f]/10 border-2 border-[#34C759]/30 shadow-md animate-slideDown">
          <span className="text-lg">✓</span>
          <span className="text-[13px] text-[#34C759] font-medium">
            {successMessage}
          </span>
        </div>
      )}

      <Button
        type="submit"
        disabled={isDisabled}
        isLoading={isLoading}
        variant="success"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Spinner />
            Gerando tarefas com IA...
          </span>
        ) : (
          "✨ Gerar com IA"
        )}
      </Button>
    </form>
  );
}
