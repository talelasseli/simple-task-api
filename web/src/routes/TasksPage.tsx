import { useEffect, useState } from "react";
import ErrorMessage from "../components/ErrorMessage";
import TaskForm from "../components/TaskForm";
import TaskList from "../components/TaskList";
import { useAuth } from "../context/useAuth";
import { createTask, deleteTask, getTasks, updateTask } from "../lib/api";
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
        return;
      }

      setError(null);
      setIsLoading(true);

      try {
        const nextTasks = await getTasks(accessToken);

        if (!ignore) {
          setTasks(nextTasks);
        }
      } catch (caughtError) {
        if (!ignore) {
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
  }, [accessToken]);

  async function handleCreate(title: string) {
    if (!accessToken) {
      return;
    }

    setError(null);
    setIsCreating(true);

    try {
      const task = await createTask(accessToken, title);
      setTasks((currentTasks) => [task, ...currentTasks]);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to create task");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleUpdate(taskId: string, title: string) {
    if (!accessToken) {
      return;
    }

    setError(null);

    try {
      const updatedTask = await updateTask(accessToken, taskId, title);
      setTasks((currentTasks) => currentTasks.map((task) => (
        task.id === taskId ? updatedTask : task
      )));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update task");
    }
  }

  async function handleDelete(taskId: string) {
    if (!accessToken) {
      return;
    }

    setError(null);

    try {
      await deleteTask(accessToken, taskId);
      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
    } catch (caughtError) {
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
