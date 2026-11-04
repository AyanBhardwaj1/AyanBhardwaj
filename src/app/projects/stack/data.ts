import type { ProjectPageData } from "@/components/project-page/types";

export const data: ProjectPageData = {
  overview: [
    "Stack is a workspace that adapts to what you do. Notes, deadlines and databases live in one place instead of three apps.",
    "Its AI tutor quizzes you on your own notes, so studying starts from what you actually wrote down.",
  ],
  features: [
    {
      title: "Notes",
      body: "Write and organize notes in the same workspace as everything else.",
    },
    {
      title: "Deadlines",
      body: "Keep due dates next to the work they belong to.",
    },
    {
      title: "Databases",
      body: "Structure information into databases when a list is not enough.",
    },
    {
      title: "An AI tutor",
      body: "Generates quizzes from your own notes.",
    },
  ],
};
