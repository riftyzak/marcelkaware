import { AdminBadgeEditor } from "@/components/content/admin-badge-editor";

export default async function AdminBadgeEditorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <AdminBadgeEditor slug={slug} />;
}
