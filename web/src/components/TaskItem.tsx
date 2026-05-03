import type { FormEvent } from "react";
import { useState } from "react";
import type { Task } from "../types/api";

type TaskItemProps = {
  onDelete: (taskId: string) => Promise<void>;
  onUpdate: (taskId: string, title: string) => Promise<void>;
  task: Task;
};

export default function TaskItem({ onDelete, onUpdate, task }: TaskItemProps) {
  const [draftTitle, setDraftTitle] = useState(task.title);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextTitle = draftTitle.trim();

    if (!nextTitle || nextTitle === task.title) {
      setDraftTitle(task.title);
      setIsEditing(false);
      return;
    }

    setIsSaving(true);

    try {
      await onUpdate(task.id, nextTitle);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <li className="task-item">
      {isEditing ? (
        <form className="task-edit-form" onSubmit={handleUpdate}>
          <input
            aria-label="Task title"
            maxLength={200}
            onChange={(event) => setDraftTitle(event.target.value)}
            value={draftTitle}
          />
          <div className="task-actions">
            <button disabled={isSaving} type="submit">Save</button>
            <button
              disabled={isSaving}
              onClick={() => {
                setDraftTitle(task.title);
                setIsEditing(false);
              }}
              type="button"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <div>
            <p className="task-title">{task.title}</p>
            <p className="task-meta">Created {new Date(task.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="task-actions">
            <button onClick={() => setIsEditing(true)} type="button">Edit</button>
            <button className="danger-button" onClick={() => onDelete(task.id)} type="button">
              Delete
            </button>
          </div>
        </>
      )}
    </li>
  );
}
