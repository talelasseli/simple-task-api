import type { FormEvent } from "react";
import { useState } from "react";

type TaskFormProps = {
  isSubmitting: boolean;
  onCreate: (title: string) => Promise<void>;
};

export default function TaskForm({ isSubmitting, onCreate }: TaskFormProps) {
  const [title, setTitle] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextTitle = title.trim();

    if (!nextTitle) {
      return;
    }

    await onCreate(nextTitle);
    setTitle("");
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <label>
        New task
        <input
          maxLength={200}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What needs to get done?"
          value={title}
        />
      </label>
      <button className="primary-button" disabled={isSubmitting || !title.trim()} type="submit">
        Add task
      </button>
    </form>
  );
}
