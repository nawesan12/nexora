import { api } from "@/lib/api-client";
import type { Task, TaskComment } from "@pronto/shared/types";
import type { TaskInput, TaskCommentInput } from "@pronto/shared/schemas";

interface ListTasksParams {
  page?: number;
  pageSize?: number;
}

export const tasksApi = {
  list: ({ page = 1, pageSize = 20 }: ListTasksParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    return api.getWithMeta<Task[]>(`/api/v1/tareas?${params}`);
  },
  get: (id: string) => api.get<Task>(`/api/v1/tareas/${id}`),
  create: (data: TaskInput) =>
    api.post<Task>("/api/v1/tareas", data),
  update: (id: string, data: TaskInput) =>
    api.put<Task>(`/api/v1/tareas/${id}`, data),
  delete: (id: string) => api.del(`/api/v1/tareas/${id}`),
  listComments: (taskId: string) =>
    api.get<TaskComment[]>(`/api/v1/tareas/${taskId}/comments`),
  createComment: (taskId: string, data: TaskCommentInput) =>
    api.post<TaskComment>(`/api/v1/tareas/${taskId}/comments`, data),
};
