import { projects, type Project } from "@/content/content";
import { roleTags } from "./roles";

/** Stack names without versions or notes ("Tauri 2", "Moss SDK (WASM)"). */
const norm = (s: string) =>
  s
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(/\s+\d+(\.\d+)*$/, "")
    .trim()
    .toLowerCase();

/** Languages nearly everything uses: a weak signal on their own. */
const COMMON = new Set(["typescript", "javascript", "python"]);

/**
 * Projects most like this one. A shared specific tool counts most, then the
 * same category or place it was built, then shared role lenses; common
 * languages barely count. `why` says what they share.
 */
export function related(
  id: string,
  { n = 3, exclude = [] as string[] } = {},
): { project: Project; why: string }[] {
  const me = projects.find((p) => p.id === id);
  if (!me) return [];
  const myRoles = new Set(roleTags(me));
  const myStack = new Set(me.stack.map(norm));
  return projects
    .filter((p) => p.id !== id && !exclude.includes(p.id))
    .map((p, i) => {
      const shared = p.stack.filter((s) => myStack.has(norm(s)));
      const specific = shared.filter((s) => !COMMON.has(norm(s)));
      const sameCat = p.category === me.category;
      const sameHome = !!me.builtAt && p.builtAt === me.builtAt;
      const roles = roleTags(p).filter((r) => myRoles.has(r)).length;
      const score =
        specific.length * 3 +
        (shared.length - specific.length) * 0.5 +
        (sameCat ? 2 : 0) +
        (sameHome ? 1.5 : 0) +
        roles;
      const why = specific.length
        ? specific.slice(0, 3).join(" · ")
        : sameCat
          ? `Also ${me.category}`
          : sameHome
            ? `Also built at ${me.builtAt}`
            : shared.slice(0, 2).join(" · ");
      return { project: p, score, why, i };
    })
    .filter((x) => x.score >= 3)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, n)
    .map(({ project, why }) => ({ project, why }));
}
