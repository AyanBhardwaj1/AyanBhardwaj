"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readExplored } from "@/components/project-page/ProjectExtras";

/**
 * For a returning visitor who has opened some case studies but not all:
 * "3 of 7 explored · Next unseen: Runway →". Nothing for first visits or
 * when all are done (the tracker on each page says thanks then).
 */
export function ContinueExploring({
  order,
  names,
}: {
  order: string[];
  names: Record<string, string>;
}) {
  const [seen, setSeen] = useState<string[] | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads browser-only storage after mount
    setSeen(readExplored());
  }, []);
  if (!seen || !seen.length || seen.length >= order.length) return null;
  const next = order.find((id) => !seen.includes(id));
  if (!next) return null;
  return (
    <p className="t-label text-muted -mt-6 mb-10 flex flex-wrap items-center gap-x-3 md:-mt-10 md:mb-14">
      <span>
        {seen.length} of {order.length} case studies explored
      </span>
      <Link
        href={`/projects/${next}`}
        className="text-accent inline-flex min-h-9 items-center underline-offset-4 hover:underline"
      >
        Next unseen: {names[next]} →
      </Link>
    </p>
  );
}
