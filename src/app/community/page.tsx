import { CommunityAuthGate } from "@/components/community/community-auth-gate";
import { CommunityIndex } from "@/components/community/community-index";
import { requireAuthenticatedPage } from "@/lib/auth/require-auth";

export default async function CommunityPage() {
  await requireAuthenticatedPage();
  return (
    <CommunityAuthGate>
      <CommunityIndex />
    </CommunityAuthGate>
  );
}
