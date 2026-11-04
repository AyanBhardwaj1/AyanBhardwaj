import { DefaultProjectBody } from "@/components/project-page/DefaultProjectPage";
import { ProjectShell } from "@/components/project-page/ProjectShell";
import { projectMetadata } from "@/lib/projects";
import { data } from "./data";

export const metadata = projectMetadata("runway");

export default function Page() {
  return (
    <ProjectShell slug="runway">
      <DefaultProjectBody slug="runway" data={data} />
    </ProjectShell>
  );
}
