import TaskItem from "./TaskItem";
import type { Task } from "../types/api";

type TaskListProps = {
  onDelete: (taskId: string) => Promise<void>;
  onUpdate: (taskId: string, title: string) => Promise<void>;
  tasks: Task[];
};

export default function TaskList({ onDelete, onUpdate, tasks }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <section className="empty-state">
        <h2>No tasks yet</h2>
        <p>Create your first task and it will show up here.</p>
      </section>
    );
  }

  return (
    <ul className="task-list" aria-label="Tasks">
      {tasks.map((task) => (
        <TaskItem key={task.id} onDelete={onDelete} onUpdate={onUpdate} task={task} />
      ))}
    </ul>
  );
}
