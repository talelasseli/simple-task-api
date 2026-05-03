export type User = {
  id: string;
  email: string;
  createdAt: string;
};

export type AuthResponse = {
  accessToken: string;
  user: User;
};

export type Task = {
  id: string;
  title: string;
  completed: boolean;
  userId: string;
  createdAt: string;
};

export type ApiErrorBody = {
  error?: string;
};
