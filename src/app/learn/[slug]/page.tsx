import type { Metadata } from "next";
import { CoursePlayer } from "@/components/learn/CoursePlayer";

export const metadata: Metadata = {
  title: "Course",
  robots: { index: false, follow: false },
};

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CoursePlayer slug={slug} />;
}
