import { JarvisBody } from "@/components/projects/mossjarvis/JarvisBody";
import { ProjectShell } from "@/components/project-page/ProjectShell";
import { projectMetadata } from "@/lib/projects";

export const metadata = projectMetadata("mossjarvis");

export default function Page() {
  return (
    <ProjectShell slug="mossjarvis" barTheme="dark">
      <JarvisBody />
    </ProjectShell>
  );
}
