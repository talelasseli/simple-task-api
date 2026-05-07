import { useEffect, useState } from "react";
import ErrorMessage from "../components/ErrorMessage";
import TaskForm from "../components/TaskForm";
import TaskList from "../components/TaskList";
import { useAuth } from "../context/useAuth";
import { createTask, deleteTask, getTasks, updateTask } from "../lib/api";
import { logError, logInfo } from "../lib/logger";
import type { Task } from "../types/api";

export default function TasksPage() {
  const { accessToken, logout, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    let ignore = false;

    async function loadTasks() {
      if (!accessToken) {
        logInfo("Task load skipped: missing access token");
        return;
      }

      logInfo("Task load started", { userId: user?.id });
      setError(null);
      setIsLoading(true);

      try {
        const nextTasks = await getTasks(accessToken);

        if (!ignore) {
          setTasks(nextTasks);
          logInfo("Task load completed", { userId: user?.id, taskCount: nextTasks.length });
        }
      } catch (caughtError) {
        if (!ignore) {
          logError("Task load failed", { userId: user?.id, error: caughtError });
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load tasks");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadTasks();

    return () => {
      ignore = true;
    };
  }, [accessToken, user?.id]);

  async function handleCreate(title: string) {
    if (!accessToken) {
      logInfo("Task create skipped: missing access token");
      return;
    }

    logInfo("Task create started", { userId: user?.id, titleLength: title.length });
    setError(null);
    setIsCreating(true);

    try {
      const task = await createTask(accessToken, title);
      setTasks((currentTasks) => [task, ...currentTasks]);
      logInfo("Task create completed", { userId: user?.id, taskId: task.id });
    } catch (caughtError) {
      logError("Task create failed", { userId: user?.id, error: caughtError });
      setError(caughtError instanceof Error ? caughtError.message : "Unable to create task");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleUpdate(taskId: string, title: string) {
    if (!accessToken) {
      logInfo("Task update skipped: missing access token", { taskId });
      return;
    }

    logInfo("Task update started", { userId: user?.id, taskId, titleLength: title.length });
    setError(null);

    try {
      const updatedTask = await updateTask(accessToken, taskId, title);
      setTasks((currentTasks) => currentTasks.map((task) => (
        task.id === taskId ? updatedTask : task
      )));
      logInfo("Task update completed", { userId: user?.id, taskId });
    } catch (caughtError) {
      logError("Task update failed", { userId: user?.id, taskId, error: caughtError });
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update task");
    }
  }

  async function handleDelete(taskId: string) {
    if (!accessToken) {
      logInfo("Task delete skipped: missing access token", { taskId });
      return;
    }

    logInfo("Task delete started", { userId: user?.id, taskId });
    setError(null);

    try {
      await deleteTask(accessToken, taskId);
      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
      logInfo("Task delete completed", { userId: user?.id, taskId });
    } catch (caughtError) {
      logError("Task delete failed", { userId: user?.id, taskId, error: caughtError });
      setError(caughtError instanceof Error ? caughtError.message : "Unable to delete task");
    }
  }

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Task Tracker</p>
          <h1>Your tasks</h1>
          <p className="muted">Signed in as {user?.email}</p>
        </div>
        <button className="secondary-button" onClick={logout} type="button">Log out</button>
      </header>

      <section className="dashboard-card">
        <TaskForm isSubmitting={isCreating} onCreate={handleCreate} />
        <ErrorMessage message={error} />
      </section>

      <section className="dashboard-card">
        {isLoading ? <p className="muted">Loading tasks...</p> : (
          <TaskList onDelete={handleDelete} onUpdate={handleUpdate} tasks={tasks} />
        )}
      </section>
    </main>
  );
}
