import { AdminUserBadgeAssignment } from "@/components/dashboard/admin-user-badge-assignment";

export default async function AdminUserBadgesPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return <AdminUserBadgeAssignment userId={userId} />;
}
