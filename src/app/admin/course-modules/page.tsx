import { AdminShell } from "@/components/admin/AdminShell";
import { CourseModulesAdmin } from "@/components/admin/CourseModulesAdmin";

export default function AdminCourseModulesPage() {
  return (
    <AdminShell active="course-modules">
      <CourseModulesAdmin />
    </AdminShell>
  );
}
