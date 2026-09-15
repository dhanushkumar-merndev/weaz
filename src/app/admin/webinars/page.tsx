import { AdminShell } from "@/components/admin/AdminShell";
import { WebinarAdmin } from "@/components/admin/WebinarAdmin";

export default function AdminWebinarsPage() {
  return (
    <AdminShell active="webinars">
      <WebinarAdmin />
    </AdminShell>
  );
}
