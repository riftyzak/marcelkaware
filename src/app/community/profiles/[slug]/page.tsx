import { CommunityAuthGate } from "@/components/community/community-auth-gate";
import { CommunityProfileCard } from "@/components/community/community-profile-card";

export default async function CommunityProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <CommunityAuthGate>
      <CommunityProfileCard slug={slug} />
    </CommunityAuthGate>
  );
}
