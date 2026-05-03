import type { FormEvent } from "react";
import { useState } from "react";
import { Link } from "react-router";
import ErrorMessage from "./ErrorMessage";

type AuthFormProps = {
  alternateHref: string;
  alternateLabel: string;
  error: string | null;
  onSubmit: (email: string, password: string) => Promise<void>;
  submitLabel: string;
  subtitle: string;
  title: string;
};

export default function AuthForm({
  alternateHref,
  alternateLabel,
  error,
  onSubmit,
  submitLabel,
  subtitle,
  title,
}: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(email, password);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="auth-title">
        <p className="eyebrow">Task Tracker</p>
        <h1 id="auth-title">{title}</h1>
        <p className="muted">{subtitle}</p>

        <form className="stack" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label>
            Password
            <input
              autoComplete={submitLabel === "Create account" ? "new-password" : "current-password"}
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          <ErrorMessage message={error} />
          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Please wait..." : submitLabel}
          </button>
        </form>

        <Link className="text-link" to={alternateHref}>{alternateLabel}</Link>
      </section>
    </main>
  );
}
