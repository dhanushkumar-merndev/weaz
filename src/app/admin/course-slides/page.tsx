import { AdminShell } from "@/components/admin/AdminShell";
import { CourseSlidesAdmin } from "@/components/admin/CourseSlidesAdmin";

export default function AdminCourseSlidesPage() {
  return (
    <AdminShell active="course-slides">
      <CourseSlidesAdmin />
    </AdminShell>
  );
}
