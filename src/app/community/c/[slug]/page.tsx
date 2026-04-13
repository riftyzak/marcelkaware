import { CommunityAuthGate } from "@/components/community/community-auth-gate";
import { CommunityCategoryView } from "@/components/community/community-category-view";
import { requireAuthenticatedPage } from "@/lib/auth/require-auth";

export default async function CommunityCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAuthenticatedPage();
  const { slug } = await params;
  return (
    <CommunityAuthGate>
      <CommunityCategoryView slug={slug} />
    </CommunityAuthGate>
  );
}
