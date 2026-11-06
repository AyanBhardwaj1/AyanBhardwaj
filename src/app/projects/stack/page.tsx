import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";
import {
  ProjectName,
  ProjectShell,
} from "@/components/project-page/ProjectShell";
import { Flashcard } from "@/components/projects/stack/Flashcard";
import { NoteGraph } from "@/components/projects/stack/NoteGraph";
import { QuickCapture } from "@/components/projects/stack/QuickCapture";
import { QuizMe } from "@/components/projects/stack/QuizMe";
import { STYLES } from "@/components/projects/stack/styleList";
import { StyleSwitcher } from "@/components/projects/stack/StyleSwitcher";
import { s } from "@/components/projects/stack/styles";
import { getProject, projectMetadata } from "@/lib/projects";
import { bundle, features, intro, media, styleNotes } from "./data";

export const metadata = projectMetadata("stack");

function Head({
  kicker,
  id,
  title,
  children,
}: {
  kicker: string;
  id: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-10 grid gap-6 lg:grid-cols-12 lg:items-end">
      <div className="lg:col-span-7">
        <p className={s.kicker}>{kicker}</p>
        <h2 id={`${id}-title`} className={s.h2}>
          {title}
        </h2>
      </div>
      {children && <div className={`${s.muted} lg:col-span-5`}>{children}</div>}
    </header>
  );
}

function Shot({
  img,
  wide = false,
}: {
  img: { src: string; alt: string; width: number; height: number };
  /** spans both gallery columns */
  wide?: boolean;
}) {
  return (
    <figure className={s.shot}>
      <Image
        src={img.src}
        alt={img.alt}
        width={img.width}
        height={img.height}
        sizes={
          wide
            ? "(min-width: 1280px) 1184px, (min-width: 768px) 92vw, 100vw"
            : "(min-width: 1280px) 584px, (min-width: 768px) 46vw, 100vw"
        }
        className="h-auto w-full"
      />
    </figure>
  );
}

/** The workspace mock that re-skins with the picker. */
function Preview() {
  return (
    <div className={s.app} aria-label="Preview of a Stack workspace" role="img">
      <aside className={s.sidebar} aria-hidden="true">
        <p className={s.ws}>
          <span className={s.wsIcon}>A</span> Ayan&apos;s term
        </p>
        <ul>
          <li>Home</li>
          <li className={s.sideOn}>Classes</li>
          <li>Deadlines</li>
          <li>Flashcards</li>
          <li>Applications</li>
          <li>Projects</li>
        </ul>
      </aside>
      <div className={s.page} aria-hidden="true">
        <p className={s.crumb}>Classes › CS 61B › Lectures</p>
        <p className={s.pageTitle}>Lecture 14: Heaps</p>
        <p className={s.pageText}>
          A complete binary tree in an array. The parent of k sits at k / 2.
        </p>
        <pre className={s.codeBlock}>
          <code>
            <span className={s.tokK}>void</span> swim(
            <span className={s.tokK}>int</span> k) {"{"}
            {"\n"}
            {"  "}
            <span className={s.tokK}>while</span> (k &gt; 1 &amp;&amp; less(k /
            2, k)) {"{"}
            {"\n"}
            {"    "}swap(k, k / 2); k = k / 2;
            {"\n"}
            {"  }"}
            {"\n"}
            {"}"}
          </code>
        </pre>
        <p className={s.dueHead}>Due this week</p>
        <div className={s.dueRow}>
          <span className={s.dueCard}>
            <b>PS 5</b> CS 61B · Fri
          </span>
          <span className={s.dueCard}>
            <b>Lab 3</b> CS 61B · Tue
          </span>
          <span className={s.dueCard}>
            <b>Reading 6</b> ECON 1 · Thu
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const p = getProject("stack");
  return (
    <ProjectShell slug="stack" barTheme="dark">
      <div className={s.root}>
        {/* HERO */}
        <section
          aria-labelledby="project-title"
          className={`${s.section} ${s.hero} container-page grid gap-12 lg:grid-cols-12 lg:items-center`}
        >
          <div className="lg:col-span-5">
            <p className={s.kicker}>Independent build · Productivity</p>
            <ProjectName slug="stack" className={s.h1} />
            <p className={s.lead}>{p.tagline}</p>
            <p className={`${s.muted} mt-5 max-w-[54ch]`}>{intro}</p>
            <div className="mt-8">
              <StyleSwitcher />
            </div>
            <p className={s.styleNote} aria-hidden="true">
              {STYLES.map((st) => (
                <span key={st.id} data-for={st.id}>
                  <b>{st.name}</b> · {styleNotes[st.id]}
                </span>
              ))}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {p.links.live && (
                <a
                  href={p.links.live}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={s.cta}
                >
                  Open Stack <span aria-hidden="true">↗</span>
                  <span className="sr-only">
                    : stack-workspace.vercel.app (opens in a new tab)
                  </span>
                </a>
              )}
            </div>
          </div>
          <div className="lg:col-span-7">
            <Preview />
            <p className={`${s.note} mt-3`}>
              This whole page re-skins with the picker, the way Stack does when
              you tell it your major. Six of its styles, drawn in this
              site&apos;s three fonts.
            </p>
          </div>
        </section>

        {/* FEATURES */}
        <section
          aria-labelledby="features-title"
          className={`${s.section} container-page`}
        >
          <Head
            kicker="What it does"
            id="features"
            title="One app, not three."
          />
          <ol className={s.featureGrid}>
            {features.map((f, i) => (
              <Reveal
                as="li"
                key={f.title}
                delay={(i % 3) * 0.05}
                className={s.feature}
              >
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* CAPTURE */}
        <section
          aria-labelledby="capture-title"
          className={`${s.section} ${s.band} container-page`}
        >
          <Head
            kicker="Quick Capture"
            id="capture"
            title="Type it the way you'd say it."
          >
            <p>
              One shortcut from anywhere, one line of plain text, and it lands
              in the right place as the right kind of thing. Try it: this is a
              small parser written for this page, and nothing is saved.
            </p>
          </Head>
          <Reveal>
            <QuickCapture />
          </Reveal>
        </section>

        {/* STUDY */}
        <section
          aria-labelledby="study-title"
          className={`${s.section} container-page`}
        >
          <Head
            kicker="Quiz me + review"
            id="study"
            title="Study from your own notes."
          >
            <p>
              Answers are graded against the note, and the note is quoted back
              to you. A miss becomes a flashcard, and flashcards come back on a
              schedule before you forget them.
            </p>
          </Head>
          <Reveal>
            <QuizMe />
          </Reveal>
          <p className={`${s.note} mt-3`}>
            Scripted questions and a keyword check stand in for the AI grader
            here.
          </p>
          <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <h3 className={s.h3}>Again, Hard, Good, Easy.</h3>
              <p className={`${s.muted} mt-3 max-w-[48ch]`}>
                The four grades and the intervals Stack shows on its own cards:
                ten minutes, one day, four days, nine days. Grade a card and
                watch where it lands on the next two weeks.
              </p>
            </div>
            <Reveal className="lg:col-span-7">
              <Flashcard />
            </Reveal>
          </div>
        </section>

        {/* GRAPH */}
        <section
          aria-labelledby="graph-title"
          className={`${s.section} container-page`}
        >
          <Head
            kicker="Linked notes"
            id="graph"
            title="Notes that find each other."
          >
            <p>
              Solid lines are links you made. Dashed lines are connections Stack
              found on its own, and every page lists its related notes. Hover or
              tab through the notes.
            </p>
          </Head>
          <Reveal>
            <NoteGraph />
          </Reveal>
        </section>

        {/* UNDER THE HOOD */}
        <section
          aria-labelledby="hood-title"
          className={`${s.section} container-page`}
        >
          <Head
            kicker="Under the hood"
            id="hood"
            title="What the public build shows."
          >
            <p>
              The repository is private, so this list is only what the shipped
              app reveals about itself. The back end, database and model
              provider aren&apos;t covered here.
            </p>
          </Head>
          <dl className={s.hood}>
            {bundle.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <ul className="mt-8 flex flex-wrap gap-1.5" aria-label="Stack">
            {p.stack.map((x) => (
              <li key={x} className={s.chip}>
                {x}
              </li>
            ))}
          </ul>
        </section>

        {/* SCREENS */}
        <section
          aria-labelledby="screens-title"
          className={`${s.section} container-page`}
        >
          <Head kicker="Screens" id="screens" title="The real thing.">
            <p>
              From the public landing page, including three more of its styles.
            </p>
          </Head>
          <div className="grid gap-4 md:grid-cols-2">
            <Reveal className="md:col-span-2">
              <Shot img={media.lead} wide />
            </Reveal>
            {[...media.styles, ...media.screens].map((m, i) => (
              <Reveal
                key={m.src}
                delay={(i % 2) * 0.05}
                className={i === 2 ? "md:col-span-2" : undefined}
              >
                <Shot img={m} wide={i === 2} />
              </Reveal>
            ))}
          </div>
        </section>
      </div>
    </ProjectShell>
  );
}
