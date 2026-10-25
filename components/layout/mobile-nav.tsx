"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarDays, ClipboardList, Drill, Gauge, LayoutGrid, ShieldCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const mobileNavigation = [
  { href: "/", label: "Hem", icon: Gauge },
  { href: "/players", label: "Spelare", icon: Users },
  { href: "/trainings", label: "Träningar", icon: CalendarDays },
  { href: "/training-plans", label: "Träningsplaner", icon: ClipboardList },
  { href: "/drills", label: "Övningar", icon: Drill },
  { href: "/matches", label: "Matcher", icon: ShieldCheck },
  { href: "/tactics", label: "Taktiktavla", icon: LayoutGrid },
  { href: "/statistics", label: "Statistik", icon: BarChart3 },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-panel/95 px-2 pb-2 pt-2 backdrop-blur lg:hidden">
      <ul className="flex gap-1 overflow-x-auto pb-1">
        {mobileNavigation.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
          return (
            <li key={item.href} className="min-w-[96px] shrink-0">
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center rounded-md px-1 text-[11px] leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
                  active ? "bg-accent text-black" : "text-muted",
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="mt-1">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
