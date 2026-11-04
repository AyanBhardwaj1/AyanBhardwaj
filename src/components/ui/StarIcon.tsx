/** A small drawn star for GitHub star counts (renders the same on every OS font). */
export function StarIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className={`inline-block size-[0.85em] -translate-y-px align-baseline ${className}`}
      fill="currentColor"
    >
      <path d="M8 1.2 10.1 5.6l4.8.6-3.5 3.3.9 4.8L8 12l-4.3 2.3.9-4.8L1.1 6.2l4.8-.6z" />
    </svg>
  );
}
