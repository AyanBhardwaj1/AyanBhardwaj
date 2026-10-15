/**
 * Bold the metrics inside a sentence ("5,000+ articles", "70%", "$15,000",
 * "0.85 to 0.97", "sub-10ms"). Suhaib-style emphasis without hand-marking copy.
 */
const METRIC =
  /((?<![A-Za-z@.\d-])\$?\d+(?:[.,]\d+)*(?:%\+?|\+%?)?(?:ms)?(?![A-Za-z\d])|sub-10ms)/g;

export function Emph({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const parts = text.split(METRIC);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="text-fg font-semibold">
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </span>
  );
}
