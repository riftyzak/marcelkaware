import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { requireAuthenticatedPage } from "@/lib/auth/require-auth";

export default async function CommunityAlertsPage() {
  await requireAuthenticatedPage();
  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "Community", href: "/community" }, { label: "Alerts" }]} />

      <div className="space-y-2 border-b border-[color:var(--border)] pb-4">
        <h1 className="text-[2rem] font-semibold tracking-tight text-[color:var(--text)]">Alerts</h1>
        <p className="max-w-2xl text-sm leading-7 text-[color:var(--text-muted)]">
          Forum notifications and account alerts will land here. This route is the current target for the community
          header bell icon.
        </p>
      </div>

      <div className="border border-[color:var(--border)] bg-[color:var(--panel)] px-5 py-6 text-sm text-[color:var(--text-muted)]">
        You have no alerts yet.
      </div>
    </div>
  );
}
