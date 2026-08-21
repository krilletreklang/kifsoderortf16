import { MobileNav } from "@/components/layout/mobile-nav";
import { Logo } from "@/components/layout/logo";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

interface AppShellProps {
  userEmail: string;
  teamLabel: string;
  onLogout: () => Promise<void>;
  children: React.ReactNode;
}

export function AppShell({ userEmail, teamLabel, onLogout, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_rgba(200,164,67,0.16),_transparent_38%),radial-gradient(circle_at_bottom_left,_rgba(200,164,67,0.12),_transparent_42%)]" />
      <div className="flex min-h-screen">
        <aside className="hidden w-72 flex-col border-r border-border bg-black/40 p-4 lg:flex">
          <Logo />
          <div className="mt-4">
            <Sidebar />
          </div>
        </aside>
        <div className="flex min-h-screen flex-1 flex-col pb-20 lg:pb-0">
          <Topbar title="Soderort F16" subtitle={teamLabel} userEmail={userEmail} onLogout={onLogout} />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 lg:px-6 lg:py-6">{children}</main>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
