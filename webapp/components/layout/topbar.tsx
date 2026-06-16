"use client";

import { Activity } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Badge } from "@/components/ui/badge";

export function Topbar({
  title,
  description,
  right,
}: {
  title: string;
  description?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur supports-[backdrop-filter]:bg-bg/65">
      <div className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg md:text-xl font-semibold tracking-tight">
              {title}
            </h1>
            <Badge tone="ok" className="hidden sm:inline-flex">
              <Activity className="size-3 animate-pulse" />
              Live
            </Badge>
          </div>
          {description && (
            <p className="text-sm text-muted mt-0.5">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {right}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
