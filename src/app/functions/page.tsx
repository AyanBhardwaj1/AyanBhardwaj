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
        anywhere on the site and type a code, then Enter. Single-key shortcuts
        can be turned off with{" "}
        <span className="t-data text-accent">KEYS &lt;GO&gt;</span>.
      </p>
      <div className="mt-6">
        <PaletteTrigger label="Open the palette" className="pill" />
      </div>
      {groups.map((g) => (
        <section key={g} aria-labelledby={`fn-${g}`} className="mt-16">
          <h2 id={`fn-${g}`} className="t-label text-muted mb-3">
            /{g}
          </h2>
          <table className="t-data border-line w-full border-t text-left">
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
                    className="border-line border-b align-top"
                  >
                    <td className="text-accent w-24 py-3 pr-4">
                      {c.mnemonic}{" "}
                      <span className="text-muted">&lt;GO&gt;</span>
                    </td>
                    <td className="py-3 pr-4">
                      <a
                        href={c.href}
                        className="link text-fg"
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
    </main>
  );
}
