/**
 * Class names for runway.css: s.board -> "rw-board". (A CSS module would be
 * nicer, but this repo's turbopack rule compiles every *.css as global.)
 */
export const s: Record<string, string> = new Proxy(
  {},
  { get: (_, k) => `rw-${String(k)}` },
);
