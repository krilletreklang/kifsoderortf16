"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";

interface LoginState {
  error?: string;
}

interface LoginFormProps {
  action: (previousState: LoginState, formData: FormData) => Promise<LoginState>;
}

const initialState: LoginState = {};

export function LoginForm({ action }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm text-muted">
          E-post
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="h-11 w-full rounded-lg border border-border bg-panel-elevated px-3 text-foreground outline-none focus:border-accent"
          placeholder="coach@kifsoderort.se"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm text-muted">
          Lösenord
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="h-11 w-full rounded-lg border border-border bg-panel-elevated px-3 text-foreground outline-none focus:border-accent"
          placeholder="••••••••"
        />
      </div>

      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Loggar in..." : "Logga in"}
      </Button>
    </form>
  );
}
