import { COMMANDS, EXAMPLES, linkSafe } from "@/lib/terminal-commands";
import type { Metadata } from "next";
import Link from "next/link";
import { commands } from "@/lib/commands";
import { hasResume } from "@/lib/site";
import { PaletteTrigger } from "@/components/palette/PaletteTrigger";

export const metadata: Metadata = {
  title: "Function directory",
  description:
    "Every ⌘K command on Ayan Bhardwaj's site, Bloomberg-style: mnemonic, name, and where it goes.",
  alternates: { canonical: "/functions" },
  openGraph: {
    url: "/functions",
    title: "Function directory · Ayan Bhardwaj",
    description:
      "Every ⌘K command on Ayan Bhardwaj's site, Bloomberg-style: mnemonic, name, and where it goes.",
  },
};

/** No-JS fallback for the palette, and a fun page on its own. */
export default function FunctionsPage() {
  const list = commands.filter((c) => !c.requiresResume || hasResume);
  const groups = [...new Set(list.map((c) => c.group))];
  return (
    <main id="main" className="container-page py-16 md:py-24">
      <p className="t-label text-muted">
        <Link href="/" className="link text-fg">
          ayan<span className="text-accent">://</span>bhardwaj
        </Link>{" "}
        / functions
      </p>
      <h1 className="t-h2 mt-8">Function directory</h1>
      <p className="text-muted mt-4 max-w-[60ch]">
        Press <kbd className="chip">⌘K</kbd> (or <kbd className="chip">/</kbd>)
        anywhere on the site, or tap the search button in the top bar, and type
        a code, then Enter. Single-key shortcuts can be turned off with{" "}
        <span className="t-data text-accent">KEYS &lt;GO&gt;</span>.
      </p>
      <div className="mt-6">
        <PaletteTrigger label="Open the palette" className="pill" alwaysLabel />
      </div>
      {groups.map((g) => (
        <section key={g} aria-labelledby={`fn-${g}`} className="mt-16">
          <h2 id={`fn-${g}`} className="t-label text-muted mb-3">
            /{g}
          </h2>
          <table className="t-data border-line w-full table-fixed border-t text-left">
            <colgroup>
              <col className="w-28 md:w-36" />
              <col className="w-auto sm:w-[34%]" />
              <col className="hidden sm:table-column" />
            </colgroup>
            <thead className="sr-only">
              <tr>
                <th scope="col">Mnemonic</th>
                <th scope="col">Function</th>
                <th scope="col">Description</th>
              </tr>
            </thead>
            <tbody>
              {list
                .filter((c) => c.group === g)
                .map((c) => (
                  <tr
                    key={c.id}
                    id={c.id.split(".").at(-1)}
                    className="border-line hover:bg-card focus-within:bg-card target:bg-card relative border-b align-top transition-colors duration-150"
                  >
                    <td className="text-accent py-3 pr-4 pl-2">
                      {c.mnemonic}{" "}
                      <span className="text-muted">&lt;GO&gt;</span>
                    </td>
                    <td className="py-3 pr-4">
                      <a
                        href={c.href}
                        className="link text-fg after:absolute after:inset-0 after:content-['']"
                        {...(c.href.startsWith("http")
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                      >
                        {c.title}
                      </a>
                    </td>
                    <td className="text-muted hidden py-3 sm:table-cell">
                      {c.hint}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      ))}

      {/* The terminal's commands, each with an example that runs from a
          link (read-only ones replay via ?run=). */}
      <section aria-labelledby="fn-terminal" className="mt-16">
        <h2 id="fn-terminal" className="t-label text-muted mb-3">
          /terminal
        </h2>
        <p className="text-muted mb-4 max-w-[60ch]">
          The same site as a command line. Type{" "}
          <code>help &lt;command&gt;</code> there for examples.
        </p>
        <table className="t-data border-line w-full table-fixed border-t text-left">
          <colgroup>
            <col className="w-36 md:w-56" />
            <col className="w-auto" />
            <col className="hidden sm:table-column sm:w-[34%]" />
          </colgroup>
          <thead className="sr-only">
            <tr>
              <th scope="col">Command</th>
              <th scope="col">What it does</th>
              <th scope="col">Try it</th>
            </tr>
          </thead>
          <tbody>
            {COMMANDS.map((c) => {
              const ex =
                EXAMPLES[c.name]?.find((e) => e.startsWith(c.name)) ?? c.name;
              const runs = linkSafe(ex);
              const href = runs
                ? `/terminal?run=${encodeURIComponent(ex)}`
                : "/terminal";
              return (
                <tr
                  key={c.name}
                  className="border-line hover:bg-card focus-within:bg-card border-b align-top transition-colors duration-150"
                >
                  <td className="py-3 pr-4 pl-2">
                    <a href={href} className="link text-accent">
                      <code className="[overflow-wrap:anywhere]">
                        {c.args ? `${c.name} ${c.args}` : c.name}
                      </code>
                    </a>
                  </td>
                  <td className="text-muted py-3 pr-4">{c.help}</td>
                  <td className="hidden py-3 sm:table-cell">
                    {runs ? (
                      <a href={href} className="link text-fg">
                        $ {ex}
                      </a>
                    ) : (
                      <span className="text-muted">$ {ex}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </main>
  );
}
