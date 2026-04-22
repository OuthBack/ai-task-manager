'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

interface TaskFormProps {
  onSubmit: (title: string) => Promise<void>;
  isLoading?: boolean;
}

export function TaskForm({
  onSubmit,
  isLoading = false,
}: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const isDisabled = !title.trim() || isSending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setIsSending(true);
      await onSubmit(title);
      setTitle('');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao criar tarefa';
      setError(message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        type="text"
        placeholder="Ex: Estudar TypeScript"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={isSending || isLoading}
        aria-label="Task title"
      />

      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      <Button
        type="submit"
        disabled={isDisabled || isLoading}
        isLoading={isSending || isLoading}
      >
        Adicionar Tarefa
      </Button>
    </form>
  );
}
