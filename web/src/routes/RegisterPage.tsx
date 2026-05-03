import { useState } from "react";
import { Navigate, useNavigate } from "react-router";
import AuthForm from "../components/AuthForm";
import { useAuth } from "../context/useAuth";

export default function RegisterPage() {
  const { isAuthenticated, register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Navigate to="/tasks" replace />;
  }

  async function handleRegister(email: string, password: string) {
    setError(null);

    try {
      await register(email, password);
      navigate("/tasks");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to create account");
    }
  }

  return (
    <AuthForm
      alternateHref="/login"
      alternateLabel="Already have an account? Log in"
      error={error}
      onSubmit={handleRegister}
      submitLabel="Create account"
      subtitle="Create an account and keep your tasks tied to you."
      title="Create account"
    />
  );
}
