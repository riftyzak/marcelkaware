import { CommunityAuthGate } from "@/components/community/community-auth-gate";
import { CommunityThreadView } from "@/components/community/community-thread-view";

export default async function CommunityThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  return (
    <CommunityAuthGate>
      <CommunityThreadView threadId={threadId} />
    </CommunityAuthGate>
  );
}
