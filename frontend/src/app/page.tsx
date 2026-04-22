"use client";

import { useEffect } from "react";
import { TaskList } from "@/components/TaskList/TaskList";
import { TaskForm } from "@/components/TaskForm/TaskForm";
import { AiGenerator } from "@/components/AiGenerator/AiGenerator";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { useTasks } from "@/hooks/useTasks";
import { useAiGenerate } from "@/hooks/useAiGenerate";

export default function Page() {
  const tasks = useTasks();
  const aiGenerate = useAiGenerate(() => {
    tasks.addTasks([]);
    tasks.refreshTasks();
  });

  useEffect(() => {
    tasks.refreshTasks();
  }, []);

  const handleCreateTask = async (title: string) => {
    await tasks.createTask(title);
  };

  const handleGenerateTasks = async (objective: string, apiKey: string) => {
    await aiGenerate.generate(objective, apiKey);
    await tasks.refreshTasks();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F5F5F7] via-[#FFFFFF] to-[#E8E8ED] py-12 px-6">
      <div className="max-w-[680px] mx-auto space-y-10">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-[32px] font-semibold text-transparent bg-gradient-to-r from-[#007AFF] to-[#9933FF] bg-clip-text tracking-[-0.5px]">
            ✓ Tarefas
          </h1>
          <p className="text-[15px] text-[#6E6E73]">
            Organize seu tempo com a ajuda da IA
          </p>
        </div>

        {/* Main Error Display */}
        {tasks.error && (
          <ErrorMessage
            message={tasks.error}
            onDismiss={() => tasks.refreshTasks()}
          />
        )}

        {/* Task List Section */}
        <section className="space-y-4">
          <h2 className="text-[17px] font-semibold text-[#1D1D1F] tracking-[-0.2px]">
            Suas Tarefas
          </h2>
          <div className="bg-white border-2 border-[rgba(0,0,0,0.06)] rounded-[16px] p-5 shadow-md hover:shadow-lg transition-shadow duration-300">
            <TaskList
              tasks={tasks.tasks}
              isLoading={tasks.isLoading}
              onToggle={tasks.toggleTask}
              onDelete={tasks.deleteTask}
            />
          </div>
        </section>

        {/* Create Task Form Section */}
        <section className="space-y-4">
          <h2 className="text-[17px] font-semibold text-[#1D1D1F] tracking-[-0.2px]">
            Adicionar Tarefa
          </h2>
          <div className="bg-gradient-to-br from-white to-[#FAFAFA] border-2 border-[rgba(0,0,0,0.06)] rounded-[16px] p-5 shadow-md hover:shadow-lg transition-shadow duration-300">
            <TaskForm onSubmit={handleCreateTask} isLoading={tasks.isLoading} />
          </div>
        </section>

        {/* AI Generator Section */}
        <section className="space-y-4">
          <h2 className="text-[17px] font-semibold text-[#1D1D1F] tracking-[-0.2px]">
            Gerar com IA
          </h2>
          <div className="bg-gradient-to-br from-[#F0E6FF] to-white border-2 border-[#9933FF]/20 rounded-[16px] p-5 shadow-md hover:shadow-lg transition-shadow duration-300">
            <AiGenerator
              onGenerate={handleGenerateTasks}
              isLoading={aiGenerate.isLoading}
              error={aiGenerate.error}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
