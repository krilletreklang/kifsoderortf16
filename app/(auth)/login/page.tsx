import { ClubLogo } from "@/components/ui/club-logo";
import { LoginForm } from "@/components/auth/login-form";
import { Card } from "@/components/ui/card";
import { loginAction } from "./actions";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_20%,_rgba(200,164,67,0.2),_transparent_40%),radial-gradient(circle_at_90%_80%,_rgba(200,164,67,0.12),_transparent_42%)]" />
      <Card className="w-full max-w-md border-border bg-panel p-6">
        <ClubLogo className="mb-4 h-20 w-full" imageClassName="object-contain" fallbackClassName="text-lg" fallbackText="KIF SÖDERORT" />
        <p className="text-xs uppercase tracking-wide text-muted">KIF Söderort</p>
        <h1 className="mt-1 text-4xl text-foreground">F16 Coach</h1>
        <p className="mt-2 text-sm text-muted">Intern inloggning för tränarstaben.</p>

        <div className="mt-6">
          <LoginForm action={loginAction} />
        </div>
      </Card>
    </div>
  );
}
