import Image from "next/image";
import Link from "next/link";
import type { CaseStudy } from "./derive";

/** Compact case-study cards under an answer that mentions those projects. */
export function ProjectCards({
  items,
  onNavigate,
}: {
  items: CaseStudy[];
  onNavigate?: () => void;
}) {
  if (!items.length) return null;
  return (
    <ul
      className="mt-3 flex flex-col gap-2"
      aria-label="Case studies in this answer"
    >
      {items.map((c, i) => (
        <li
          key={c.slug}
          className="ab-starter"
          style={{ "--i": i } as React.CSSProperties}
        >
          <Link
            href={c.href}
            onClick={onNavigate}
            className="ab-card group border-line bg-card hover:border-accent/60 hover:bg-card-hover flex items-center gap-3 rounded-[12px] border p-2 pr-3"
          >
            <span
              aria-hidden="true"
              className="border-line bg-bg relative flex h-12 w-[76px] shrink-0 items-center justify-center overflow-hidden rounded-[8px] border"
            >
              {c.media ? (
                <Image
                  src={c.media.src}
                  alt=""
                  width={c.media.width}
                  height={c.media.height}
                  sizes="80px"
                  className="ab-card-img size-full object-cover"
                />
              ) : (
                <span className="text-accent font-mono text-[11px] font-medium tracking-[0.14em]">
                  {c.mnemonic}
                </span>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="text-fg block truncate text-[14px] leading-5 font-medium">
                {c.name}
              </span>
              <span className="text-muted block truncate text-[12.5px] leading-5">
                {c.tagline}
              </span>
              <span className="text-accent mt-0.5 inline-flex items-center gap-1 font-mono text-[10.5px] tracking-wider uppercase">
                Open case study
                <span aria-hidden="true" className="ab-card-go">
                  →
                </span>
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
