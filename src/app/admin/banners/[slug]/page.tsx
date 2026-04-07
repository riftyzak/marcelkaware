import { AdminBannerEditor } from "@/components/content/admin-banner-editor";

export default async function AdminBannerEditorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <AdminBannerEditor slug={slug} />;
}
