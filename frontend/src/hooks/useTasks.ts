'use client';

import { useState, useCallback } from 'react';
import { getTasks, createTask, updateTask, deleteTask } from '@/services/tasks.service';
import type { Task, TasksState } from '@/types/task.types';

interface UseTasksReturn extends TasksState {
  createTask: (title: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addTasks: (newTasks: Task[]) => void;
  refreshTasks: () => Promise<void>;
}

export function useTasks(): UseTasksReturn {
  const [state, setState] = useState<TasksState>({
    tasks: [],
    isLoading: false,
    error: null,
  });

  const refreshTasks = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const data = await getTasks();
      setState({ tasks: data, isLoading: false, error: null });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Falha ao carregar tarefas';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
    }
  }, []);

  const handleCreateTask = useCallback(
    async (title: string) => {
      try {
        setState((prev) => ({ ...prev, error: null }));
        const newTask = await createTask({ title });
        setState((prev) => ({
          ...prev,
          tasks: [...prev.tasks, newTask],
        }));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Falha ao criar tarefa';
        setState((prev) => ({ ...prev, error: message }));
        throw err;
      }
    },
    [],
  );

  const handleToggleTask = useCallback(async (id: string) => {
    // Optimistic update
    setState((prev) => {
      const taskIndex = prev.tasks.findIndex((t) => t.id === id);
      if (taskIndex === -1) return prev;

      const oldTask = prev.tasks[taskIndex];
      const newTasks = [...prev.tasks];
      newTasks[taskIndex] = {
        ...oldTask,
        isCompleted: !oldTask.isCompleted,
      };

      return { ...prev, tasks: newTasks };
    });

    try {
      const task = state.tasks.find((t) => t.id === id);
      if (!task) throw new Error('Task not found');

      await updateTask(id, { isCompleted: !task.isCompleted });
    } catch (err) {
      // Revert on error
      setState((prev) => {
        const taskIndex = prev.tasks.findIndex((t) => t.id === id);
        if (taskIndex === -1) return prev;

        const newTasks = [...prev.tasks];
        newTasks[taskIndex] = {
          ...newTasks[taskIndex],
          isCompleted: !newTasks[taskIndex].isCompleted,
        };

        const message =
          err instanceof Error ? err.message : 'Falha ao atualizar tarefa';
        return { ...prev, tasks: newTasks, error: message };
      });

      throw err;
    }
  }, [state.tasks]);

  const handleDeleteTask = useCallback(
    async (id: string) => {
      const taskIndex = state.tasks.findIndex((t) => t.id === id);
      if (taskIndex === -1) return;

      // Optimistic update
      const deletedTask = state.tasks[taskIndex];
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== id),
      }));

      try {
        await deleteTask(id);
      } catch (err) {
        // Revert on error
        setState((prev) => {
          const newTasks = [...prev.tasks];
          newTasks.splice(taskIndex, 0, deletedTask);
          const message =
            err instanceof Error ? err.message : 'Falha ao deletar tarefa';
          return { ...prev, tasks: newTasks, error: message };
        });

        throw err;
      }
    },
    [state.tasks],
  );

  const addTasks = useCallback((newTasks: Task[]) => {
    setState((prev) => ({
      ...prev,
      tasks: [...prev.tasks, ...newTasks],
    }));
  }, []);

  return {
    tasks: state.tasks,
    isLoading: state.isLoading,
    error: state.error,
    createTask: handleCreateTask,
    toggleTask: handleToggleTask,
    deleteTask: handleDeleteTask,
    addTasks,
    refreshTasks,
  };
}
