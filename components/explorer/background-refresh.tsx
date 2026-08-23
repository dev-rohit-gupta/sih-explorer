"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function BackgroundRefresh({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    fetch("/api/sync-if-stale", { method: "POST", signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((result) => { if (result?.updated) router.refresh(); })
      .catch(() => undefined);
    return () => controller.abort();
  }, [enabled, router]);
  return null;
}
