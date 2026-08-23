"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarDays, ClipboardList, Drill, Gauge, LayoutGrid, Settings, ShieldCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navigation = [
  { href: "/", label: "Dashboard", icon: Gauge },
  { href: "/players", label: "Spelare", icon: Users },
  { href: "/trainings", label: "Träningar", icon: CalendarDays },
  { href: "/matches", label: "Matcher", icon: ShieldCheck },
  { href: "/training-plans", label: "Träningsplaner", icon: ClipboardList },
  { href: "/drills", label: "Övningar", icon: Drill },
  { href: "/tactics", label: "Taktiktavla", icon: LayoutGrid },
  { href: "/statistics", label: "Statistik", icon: BarChart3 },
  { href: "/settings", label: "Inställningar", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
        {navigation.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
                active ? "bg-accent text-black" : "text-muted hover:bg-panel-elevated hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
    </nav>
  );
}
