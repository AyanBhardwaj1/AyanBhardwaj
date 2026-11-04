import { DefaultProjectBody } from "@/components/project-page/DefaultProjectPage";
import { ProjectShell } from "@/components/project-page/ProjectShell";
import { projectMetadata } from "@/lib/projects";
import { data } from "./data";

export const metadata = projectMetadata("walk-free");

export default function Page() {
  return (
    <ProjectShell slug="walk-free">
      <DefaultProjectBody slug="walk-free" data={data} />
    </ProjectShell>
  );
}
