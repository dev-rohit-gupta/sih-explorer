"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type QueryParamValue = string | number | null | undefined;
export type QueryParamUpdates = Record<string, QueryParamValue>;

type UpdateQueryOptions = {
  history?: "push" | "replace";
  /**
   * Use a real Next.js navigation when the server needs to react to the
   * changed query param (for example when loading another DB snapshot).
   * Client-only explorer state can stay on the native History API so typing
   * does not rerun the Server Component on every keypress.
   */
  navigate?: boolean;
  scroll?: boolean;
};

function applyUpdates(current: URLSearchParams, updates: QueryParamUpdates) {
  const next = new URLSearchParams(current.toString());

  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || value === "") {
      next.delete(key);
    } else {
      next.set(key, String(value));
    }
  }

  return next;
}

export function useUrlQueryState() {
  const router = useRouter();
  const pathname = usePathname();
  const nextSearchParams = useSearchParams();
  const serializedSearchParams = nextSearchParams.toString();
  const [searchParams, setSearchParams] = useState(
    () => new URLSearchParams(serializedSearchParams),
  );

  // Keep local state aligned with Back/Forward navigation and external links.
  useEffect(() => {
    setSearchParams((current) =>
      current.toString() === serializedSearchParams
        ? current
        : new URLSearchParams(serializedSearchParams),
    );
  }, [serializedSearchParams]);

  const updateQuery = useCallback(
    (updates: QueryParamUpdates, options: UpdateQueryOptions = {}) => {
      const {
        history = "replace",
        navigate = false,
        scroll = false,
      } = options;

      // window.location is the freshest source while the user is typing; it
      // avoids losing keystrokes when multiple URL updates happen quickly.
      const current = new URLSearchParams(window.location.search);
      const next = applyUpdates(current, updates);
      const query = next.toString();
      const href = query ? `${pathname}?${query}` : pathname;

      // Update controlled inputs/filtering immediately, in the same tick as
      // the address bar update.
      setSearchParams(next);

      if (navigate) {
        if (history === "push") {
          router.push(href, { scroll });
        } else {
          router.replace(href, { scroll });
        }
        return;
      }

      // Next.js integrates native History API changes with useSearchParams.
      // This keeps search/filter state shareable without rerunning the server
      // page for every character typed into the search box.
      if (history === "push") {
        window.history.pushState(null, "", href);
      } else {
        window.history.replaceState(null, "", href);
      }
    },
    [pathname, router],
  );

  return {
    searchParams,
    updateQuery,
  };
}
