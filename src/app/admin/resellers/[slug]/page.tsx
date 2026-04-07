import { AdminResellerDetail } from "@/components/content/admin-reseller-detail";

export default async function AdminResellerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <AdminResellerDetail slug={slug} />;
}
