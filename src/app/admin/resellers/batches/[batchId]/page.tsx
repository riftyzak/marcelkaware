import { AdminResellerBatchDetail } from "@/components/content/admin-reseller-batch-detail";

export default async function AdminResellerBatchPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;
  return <AdminResellerBatchDetail batchId={batchId} />;
}
