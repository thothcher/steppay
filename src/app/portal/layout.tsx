import { PortalShell } from "@/components/portal/Shell";
import { sql } from "@/lib/db";
import { getScope } from "@/lib/portal";
import { timeAgo } from "@/lib/dates";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, merchants, selected } = await getScope();
  const notifications = await sql<{ id: number; kind: string; title: string; body: string; link: string; read: boolean; created_at: Date }>(
    "SELECT id, kind, title, body, link, read, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 12",
    [user.id],
  );

  return (
    <PortalShell
      user={{ full_name: user.full_name, email: user.email, role: user.role, group_name: user.group_name }}
      merchants={merchants.map((m) => ({ id: m.id, name: m.name, merchant_id: m.merchant_id }))}
      selectedId={selected?.id ?? null}
      notifications={notifications.map((n) => ({ ...n, created_at: undefined, ago: timeAgo(n.created_at) }))}
    >
      {children}
    </PortalShell>
  );
}
