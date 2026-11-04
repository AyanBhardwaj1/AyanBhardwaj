import { DefaultProjectBody } from "@/components/project-page/DefaultProjectPage";
import { ProjectShell } from "@/components/project-page/ProjectShell";
import { projectMetadata } from "@/lib/projects";
import { data } from "./data";

export const metadata = projectMetadata("oncosense");

export default function Page() {
  return (
    <ProjectShell slug="oncosense">
      <DefaultProjectBody slug="oncosense" data={data} />
    </ProjectShell>
  );
}
