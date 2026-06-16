"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BellRing,
  Settings as SettingsIcon,
  Download,
} from "lucide-react";
import { cn } from "@/lib/cn";

const items = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/alerts", label: "Alerts", icon: BellRing },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
  { href: "/export", label: "Export", icon: Download },
];

export function MobileNav() {
  const path = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-bg/95 backdrop-blur">
      <ul className="grid grid-cols-4">
        {items.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                  active ? "text-brand" : "text-muted",
                )}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
