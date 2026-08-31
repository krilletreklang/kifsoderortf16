"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Gauge, LayoutGrid, ShieldCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const mobileNavigation = [
  { href: "/", label: "Hem", icon: Gauge },
  { href: "/players", label: "Spelare", icon: Users },
  { href: "/trainings", label: "Träning", icon: CalendarDays },
  { href: "/matches", label: "Matcher", icon: ShieldCheck },
  { href: "/tactics", label: "Taktik", icon: LayoutGrid },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-panel/95 px-2 pb-2 pt-2 backdrop-blur lg:hidden">
      <ul className="grid grid-cols-5 gap-1">
        {mobileNavigation.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center rounded-md text-xs",
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
