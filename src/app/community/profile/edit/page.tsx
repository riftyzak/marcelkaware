import { CommunityProfileSettings } from "@/components/account/community-profile-settings";
import { requireAuthenticatedPage } from "@/lib/auth/require-auth";

export default async function CommunityProfileEditPage() {
  await requireAuthenticatedPage();
  return <CommunityProfileSettings />;
}
