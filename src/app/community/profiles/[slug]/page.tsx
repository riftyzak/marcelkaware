import { CommunityAuthGate } from "@/components/community/community-auth-gate";
import { CommunityProfileCard } from "@/components/community/community-profile-card";
import { requireAuthenticatedPage } from "@/lib/auth/require-auth";

export default async function CommunityProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAuthenticatedPage();
  const { slug } = await params;

  return (
    <CommunityAuthGate>
      <CommunityProfileCard slug={slug} />
    </CommunityAuthGate>
  );
}
