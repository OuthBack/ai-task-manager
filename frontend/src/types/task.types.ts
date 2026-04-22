export interface Task {
  id: string;
  title: string;
  isCompleted: boolean;
  isAiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  title: string;
}

export interface UpdateTaskPayload {
  title?: string;
  isCompleted?: boolean;
}

export interface GenerateTasksPayload {
  objective: string;
  apiKey: string;
}

export type TasksState = {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
};

export type AiGenerateState = {
  isLoading: boolean;
  error: string | null;
};
