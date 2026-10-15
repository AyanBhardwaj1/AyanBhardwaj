/** Text badge for YC companies (no YC marks). */
export function YcBadge({ batch }: { batch: string }) {
  return (
    <span className="border-line-strong text-muted inline-flex items-center gap-1.5 rounded-xs border py-0.5 pr-1.5 pl-0.5 align-middle font-mono text-[11px] leading-none">
      <span
        aria-hidden="true"
        className="bg-yc grid size-4 place-items-center rounded-[3px] font-sans text-[11px] font-bold text-[#111]"
      >
        Y
      </span>
      <span>
        <span className="sr-only">Y Combinator </span>
        {batch}
      </span>
    </span>
  );
}
