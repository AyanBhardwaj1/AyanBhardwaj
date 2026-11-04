import { MyceliumBody } from "@/components/projects/mycelium/MyceliumBody";
import { ProjectShell } from "@/components/project-page/ProjectShell";
import { projectMetadata } from "@/lib/projects";

export const metadata = projectMetadata("mycelium", {
  image: {
    src: "/media/projects/mycelium/demo-title-scene.jpg",
    width: 1600,
    height: 900,
    alt: "Mycelium: your browser, with memory",
  },
});

export default function Page() {
  return (
    <ProjectShell slug="mycelium" barTheme="dark">
      <MyceliumBody />
    </ProjectShell>
  );
}
