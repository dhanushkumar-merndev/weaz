import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase";
import type { Json } from "@/lib/database.types";

type SupabaseAdmin = ReturnType<typeof getSupabaseAdmin>;

/**
 * Records an administrator action. Audit writing must never block or fail the
 * action it describes, so errors are logged instead of thrown.
 */
export async function recordAdminAction({
  supabase,
  adminEmail,
  action,
  entityType,
  entityId,
  changes,
}: {
  supabase: SupabaseAdmin;
  adminEmail: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  changes?: Record<string, unknown>;
}) {
  const { error } = await supabase.from("admin_audit_log").insert({
    admin_email: adminEmail.toLowerCase(),
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    changes: (changes ?? {}) as Json,
  });

  if (error) {
    console.error("Admin audit log write failed", {
      action,
      entityType,
      entityId,
      error: error.message,
    });
  }
}

/** Only the fields that actually changed are stored. */
export function diffFields<T extends Record<string, unknown>>(
  before: T | null,
  after: T
) {
  if (!before) return { created: after };

  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys(after)) {
    if (before[key] !== after[key]) {
      changes[key] = { from: before[key] ?? null, to: after[key] ?? null };
    }
  }
  return changes;
}
