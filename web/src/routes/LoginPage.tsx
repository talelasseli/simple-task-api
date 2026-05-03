import { useState } from "react";
import { Navigate, useNavigate } from "react-router";
import AuthForm from "../components/AuthForm";
import { useAuth } from "../context/useAuth";

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Navigate to="/tasks" replace />;
  }

  async function handleLogin(email: string, password: string) {
    setError(null);

    try {
      await login(email, password);
      navigate("/tasks");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to log in");
    }
  }

  return (
    <AuthForm
      alternateHref="/register"
      alternateLabel="Need an account? Create one"
      error={error}
      onSubmit={handleLogin}
      submitLabel="Log in"
      subtitle="Welcome back. Continue managing your work."
      title="Log in"
    />
  );
}
