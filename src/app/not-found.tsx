import Link from "next/link";
import { ui } from "@/content/content";

export default function NotFound() {
  return (
    <main
      id="main"
      className="container-page flex min-h-svh flex-col justify-center py-24"
    >
      <p className="t-data text-down">
        <span aria-hidden="true">▼ </span>404 · SECURITY NOT FOUND
      </p>
      <h1 className="t-display-sm mt-6 max-w-[14ch]">{ui.notFound.heading}</h1>
      <p className="t-data text-muted mt-6">
        <span className="text-accent">AYAN &gt;</span> try PROJ, EXP or HELP
        &lt;GO&gt;
      </p>
      <div className="mt-10">
        <Link href="/" className="pill pill-solid">
          {ui.notFound.button}
        </Link>
      </div>
    </main>
  );
}
