"use client";

import { useState } from "react";
import type { Task } from "@/types/task.types";

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    try {
      setIsProcessing(true);
      await onToggle(task.id);
    } catch {
      // Error is handled by parent component
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsProcessing(true);
      await onDelete(task.id);
    } catch {
      // Error is handled by parent component
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className={`flex items-center gap-3 py-4 px-0 border-b border-[rgba(0,0,0,0.06)] last:border-b-0 transition-all duration-200 ${
        isProcessing ? "opacity-50" : ""
      } hover:bg-gradient-to-r hover:from-[#007AFF]/5 hover:to-transparent`}
    >
      <input
        type="checkbox"
        checked={task.isCompleted}
        onChange={handleToggle}
        disabled={isProcessing}
        className="w-5 h-5 rounded-md cursor-pointer accent-[#34C759] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
        aria-label={`Toggle task: ${task.title}`}
      />

      <span
        className={`flex-1 text-[15px] leading-relaxed break-words transition-all duration-200 ${
          task.isCompleted ? "line-through text-[#AEAEB2]" : "text-[#1D1D1F]"
        }`}
      >
        {task.title}
      </span>

      {task.isAiGenerated && (
        <span className="inline-block px-2.5 py-1 text-[11px] font-semibold bg-gradient-to-r from-[#007AFF]/10 to-[#9933FF]/10 text-[#007AFF] rounded-[8px] whitespace-nowrap border border-[#007AFF]/20">
          ✨ IA
        </span>
      )}

      <button
        onClick={handleDelete}
        disabled={isProcessing}
        className="flex-shrink-0 text-[#FF3B30] hover:opacity-70 hover:scale-110 disabled:opacity-40 disabled:cursor-not-allowed text-lg transition-all duration-150 cursor-pointer"
        aria-label={`Delete task: ${task.title}`}
      >
        🗑️
      </button>
    </div>
  );
}
