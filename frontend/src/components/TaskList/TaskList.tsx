'use client';

import { TaskItem } from './TaskItem';
import { Spinner } from '@/components/ui/Spinner';
import type { Task } from '@/types/task.types';

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  onToggle: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function TaskList({
  tasks,
  isLoading,
  onToggle,
  onDelete,
}: TaskListProps) {
  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[15px] text-[#6E6E73]">
          Nenhuma tarefa ainda. Crie uma ou use a IA! 🚀
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[rgba(0,0,0,0.06)]">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
