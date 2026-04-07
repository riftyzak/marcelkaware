import { CommunityThreadView } from "@/components/community/community-thread-view";

export default async function CommunityThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  return <CommunityThreadView threadId={threadId} />;
}
