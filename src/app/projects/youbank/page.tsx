import { DefaultProjectBody } from "@/components/project-page/DefaultProjectPage";
import { ProjectShell } from "@/components/project-page/ProjectShell";
import { projectMetadata } from "@/lib/projects";
import { data } from "./data";

export const metadata = projectMetadata("youbank");

export default function Page() {
  return (
    <ProjectShell slug="youbank">
      <DefaultProjectBody slug="youbank" data={data} />
    </ProjectShell>
  );
}
