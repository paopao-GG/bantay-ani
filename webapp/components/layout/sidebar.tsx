"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BellRing,
  Settings as SettingsIcon,
  Download,
  Cpu,
} from "lucide-react";
import { Logo } from "@/components/graphics/logo";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

const items = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/alerts", label: "Alerts", icon: BellRing },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
  { href: "/export", label: "Export", icon: Download },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-surface/60 backdrop-blur">
      <div className="px-5 py-5 border-b border-border">
        <Logo />
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-soft text-brand"
                  : "text-fg/80 hover:bg-surface-2 hover:text-fg",
              )}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0",
                  active ? "text-brand" : "text-muted group-hover:text-fg",
                )}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border">
        <div className="rounded-xl border border-border bg-surface-2/60 p-3">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Cpu className="size-3.5" />
            <span>Firmware target</span>
          </div>
          <div className="mt-1 text-sm font-medium">ESP32 · v0.1.0</div>
          <Badge tone="brand" className="mt-2">
            Mock data
          </Badge>
        </div>
      </div>
    </aside>
  );
}
