"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, FloppyDisk } from "@phosphor-icons/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buildBus } from "@/lib/build-bus";

export function Navbar() {
  const pathname = usePathname();
  const isBuild = pathname === "/build";
  const isSquadDetail = pathname?.startsWith("/squad/");

  const canSave = useSyncExternalStore(
    buildBus.subscribe,
    () => buildBus.getCanSave(),
    () => false,
  );

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center">
          <span className="text-lg italic uppercase tracking-tight font-extrabold">
            SOHEADS
          </span>
        </Link>
        {isBuild ? (
          <Button
            size="sm"
            className="rounded-full font-medium"
            disabled={!canSave}
            onClick={() => buildBus.requestSave()}
          >
            <FloppyDisk className="mr-1 h-4 w-4" />
            Save & share
          </Button>
        ) : (
          <Link href="/build" className={cn(buttonVariants({ size: "sm" }), "rounded-full font-medium")}>
            <Plus className="mr-1 h-4 w-4" />
            {isSquadDetail ? "Build your own" : "Build squad"}
          </Link>
        )}
      </div>
    </header>
  );
}
