import { AdminShell } from "@/components/admin/AdminShell";
import { StudentAccessAdmin } from "@/components/admin/StudentAccessAdmin";

export default function AdminStudentsPage() {
  return (
    <AdminShell active="students">
      <StudentAccessAdmin />
    </AdminShell>
  );
}
