import { MyceliumBody } from "@/components/projects/mycelium/MyceliumBody";
import { ProjectShell } from "@/components/project-page/ProjectShell";
import { projectMetadata } from "@/lib/projects";

export const metadata = projectMetadata("mycelium");

export default function Page() {
  return (
    <ProjectShell slug="mycelium" barTheme="dark">
      <MyceliumBody />
    </ProjectShell>
  );
}
