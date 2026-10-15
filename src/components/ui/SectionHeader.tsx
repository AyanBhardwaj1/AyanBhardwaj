import { Reveal } from "../motion/Reveal";

export const SECTION_TOTAL = 6;

/** "/02 · EXPERIENCE" mono index, right counter "02/06", then the H2. */
export function SectionHeader({
  index,
  label,
  title,
  titleId,
  aside,
}: {
  index: number;
  label: string;
  title: React.ReactNode;
  titleId: string;
  aside?: React.ReactNode;
}) {
  const n = String(index).padStart(2, "0");
  return (
    <header className="mb-12 md:mb-20">
      <div className="t-label border-line text-muted mb-6 flex items-center justify-between border-b pb-4">
        <span>
          /{n} · {label}
        </span>
        <span aria-hidden="true" className="tabular-nums">
          {n}/{String(SECTION_TOTAL).padStart(2, "0")}
        </span>
      </div>
      <Reveal className="flex flex-wrap items-end justify-between gap-6">
        <h2 id={titleId} className="t-h2 max-w-[18ch]">
          {title}
        </h2>
        {aside}
      </Reveal>
    </header>
  );
}
