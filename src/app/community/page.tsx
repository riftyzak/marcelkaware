import { CommunityAuthGate } from "@/components/community/community-auth-gate";
import { CommunityIndex } from "@/components/community/community-index";

export default function CommunityPage() {
  return (
    <CommunityAuthGate>
      <CommunityIndex />
    </CommunityAuthGate>
  );
}
