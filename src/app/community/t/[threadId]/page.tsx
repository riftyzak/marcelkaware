import { CommunityAuthGate } from "@/components/community/community-auth-gate";
import { CommunityThreadView } from "@/components/community/community-thread-view";
import { requireAuthenticatedPage } from "@/lib/auth/require-auth";

export default async function CommunityThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  await requireAuthenticatedPage();
  const { threadId } = await params;
  return (
    <CommunityAuthGate>
      <CommunityThreadView threadId={threadId} />
    </CommunityAuthGate>
  );
}
