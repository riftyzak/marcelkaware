import { CommunityAuthGate } from "@/components/community/community-auth-gate";
import { CommunityCategoryView } from "@/components/community/community-category-view";

export default async function CommunityCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <CommunityAuthGate>
      <CommunityCategoryView slug={slug} />
    </CommunityAuthGate>
  );
}
