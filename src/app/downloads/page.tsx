import { DownloadsPanel } from "@/components/dashboard/downloads-panel";
import { requireAuthenticatedPage } from "@/lib/auth/require-auth";

export default async function DownloadsPage() {
  await requireAuthenticatedPage();
  return <DownloadsPanel />;
}
