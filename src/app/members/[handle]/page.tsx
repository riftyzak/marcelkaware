import { CommunityAuthGate } from "@/components/community/community-auth-gate";
import { MemberProfileCard } from "@/components/community/member-profile-card";

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  return (
    <CommunityAuthGate>
      <MemberProfileCard handle={handle} />
    </CommunityAuthGate>
  );
}
