import type { Metadata } from "next";
import { MyCourses } from "@/components/learn/MyCourses";

export const metadata: Metadata = {
  title: "My Courses",
  robots: { index: false, follow: false },
};

export default function LearnPage() {
  return <MyCourses />;
}
